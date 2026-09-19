import { useState, type ChangeEvent } from "react";
import { ArrowLeft, Download, FileSpreadsheet, ShieldCheck, Upload, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { auth } from "../lib/firebase";

type StudentRow = {
  username: string;
  full_name: string;
  school_year: string;
  class_group: string;
};

type ImportedStudent = StudentRow & { activation_code: string };

function splitCsvLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  // Uma pequena saga de aspas porque planilha sempre traz uma missão secundária.
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  values.push(current.trim());
  return values;
}

function parseStudentsCsv(content: string): StudentRow[] {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error("O CSV precisa ter cabeçalho e pelo menos um estudante.");
  const delimiter = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const headers = splitCsvLine(lines[0], delimiter).map((header) => header.toLocaleLowerCase("pt-BR"));
  const required = ["username", "full_name", "school_year", "class_group"];
  if (required.some((field) => !headers.includes(field))) throw new Error(`Cabeçalho obrigatório: ${required.join(", ")}.`);

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line, delimiter);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])) as StudentRow;
  });
}

function csvValue(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function StudentImportPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [imported, setImported] = useState<ImportedStudent[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    setError("");
    setImported([]);
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const parsed = parseStudentsCsv(await file.text());
      setStudents(parsed);
      setFileName(file.name);
    } catch (parseError) {
      setStudents([]);
      setFileName("");
      setError(parseError instanceof Error ? parseError.message : "Não foi possível ler o CSV.");
    }
  }

  async function importStudents() {
    setError("");
    if (!auth?.currentUser) return setError("Sua sessão terminou. Entre novamente.");
    setLoading(true);

    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch("/api/admin/import-students", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ students }),
      });
      const data = await response.json() as { students?: ImportedStudent[]; error?: string };
      if (!response.ok || !data.students) throw new Error(data.error ?? "Não foi possível importar a lista.");
      setImported(data.students);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Não foi possível importar a lista.");
    } finally {
      setLoading(false);
    }
  }

  function downloadCodes() {
    const header = "username,full_name,school_year,class_group,activation_code";
    const rows = imported.map((student) => [student.username, student.full_name, student.school_year, student.class_group, student.activation_code].map(csvValue).join(","));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "codigos-ativacao-delios.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="import-page">
      <section className="import-heading">
        <Link className="back-link dark" to="/admin"><ArrowLeft /> Voltar ao painel</Link>
        <p className="eyebrow">Somente direção</p>
        <h1>Contas estudantis</h1>
        <p>Importe usuários escolhidos pela escola e gere códigos individuais de primeiro acesso.</p>
      </section>

      <aside className="human-review-notice import-notice"><ShieldCheck /><div><strong>Use somente dados autorizados</strong><span>Não importe CPF, nascimento, contatos familiares ou informações que não sejam necessárias. A lista real deve ser manipulada por um adulto autorizado.</span></div></aside>

      <section className="import-card">
        <div className="import-card-title"><span><Users /></span><div><small>Etapa 1</small><h2>Prepare o arquivo CSV</h2></div></div>
        <p>Use exatamente estas quatro colunas:</p>
        <code>username,full_name,school_year,class_group</code>
        <p>Os nomes de usuário devem ter de 3 a 32 caracteres e usar somente letras minúsculas, números, ponto, hífen ou sublinhado.</p>
        <a className="button button-outline" href="/student-import-template.csv" download><Download /> Baixar modelo fictício</a>
      </section>

      <section className="import-card">
        <div className="import-card-title"><span><FileSpreadsheet /></span><div><small>Etapa 2</small><h2>Selecione e confira</h2></div></div>
        <label className="file-picker"><Upload /><span>{fileName || "Escolher arquivo CSV"}</span><input type="file" accept=".csv,text/csv" onChange={(event) => void chooseFile(event)} /></label>
        {students.length > 0 && <div className="import-summary"><strong>{students.length}</strong><span>estudantes prontos para importação</span></div>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary" disabled={!students.length || loading} onClick={() => void importStudents()}>{loading ? "Gerando contas…" : "Importar e gerar códigos"}</button>
      </section>

      {imported.length > 0 && (
        <section className="import-card import-success">
          <div className="import-card-title"><span><ShieldCheck /></span><div><small>Etapa 3</small><h2>Códigos gerados</h2></div></div>
          <p>Os códigos aparecem uma única vez. Baixe o arquivo, entregue cada código ao estudante correto e guarde-o somente pelo tempo necessário.</p>
          <button className="button button-dark" onClick={downloadCodes}><Download /> Baixar {imported.length} códigos</button>
        </section>
      )}
    </main>
  );
}
