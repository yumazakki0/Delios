import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, LogOut, RefreshCw, Search, ShieldCheck, UserRound } from "lucide-react";
import { signOut } from "firebase/auth";
import { collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, type Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../lib/firebase";
import { categoryLabels, statusLabels, type ReportStatus, type SupportReport } from "../types";

const statuses: ReportStatus[] = ["novo", "em_analise", "encaminhado", "concluido"];

export function AdminPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<SupportReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | ReportStatus>("todos");
  const [categoryFilter, setCategoryFilter] = useState("todos");

  const loadReports = useCallback(async () => {
    if (!db) return;
    setLoading(true); setError("");
    try {
      const snapshot = await getDocs(query(collection(db, "support_reports"), orderBy("created_at", "desc")));
      const loadedReports = snapshot.docs.map((reportDocument) => {
        const data = reportDocument.data();
        const createdAt = data.created_at as Timestamp | undefined;
        const updatedAt = data.updated_at as Timestamp | undefined;

        return {
          id: reportDocument.id,
          ...data,
          created_at: createdAt?.toDate().toISOString() ?? new Date().toISOString(),
          updated_at: updatedAt?.toDate().toISOString() ?? new Date().toISOString(),
        } as SupportReport;
      });
      setReports(loadedReports);
    } catch {
      setError("Não foi possível carregar os relatos.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { void loadReports(); }, [loadReports]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return reports.filter((report) => {
      const matchesStatus = statusFilter === "todos" || report.status === statusFilter;
      const matchesCategory = categoryFilter === "todos" || report.category === categoryFilter;
      const searchable = [report.reporter_name, report.school_year, report.class_group, report.description].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
      return matchesStatus && matchesCategory && (!term || searchable.includes(term));
    });
  }, [reports, search, statusFilter, categoryFilter]);

  const stats = useMemo(() => ({
    total: reports.length,
    new: reports.filter((item) => item.status === "novo").length,
    progress: reports.filter((item) => item.status === "em_analise" || item.status === "encaminhado").length,
    done: reports.filter((item) => item.status === "concluido").length,
  }), [reports]);

  async function updateStatus(id: string, status: ReportStatus) {
    if (!db) return;
    setReports((items) => items.map((item) => item.id === id ? { ...item, status } : item));
    try {
      await updateDoc(doc(db, "support_reports", id), { status, updated_at: serverTimestamp() });
    } catch {
      setError("A alteração não foi salva.");
      void loadReports();
    }
  }

  async function logout() {
    if (auth) await signOut(auth);
    navigate("/login", { replace: true });
  }

  return (
    <main className="admin-page">
      <section className="admin-heading">
        <div><p className="eyebrow">Área protegida</p><h1>Painel de acolhimento</h1><p>Consulte relatos e registre o andamento do atendimento.</p></div>
        <div className="admin-actions"><button className="button button-outline" onClick={() => void loadReports()}><RefreshCw /> Atualizar</button><button className="button button-dark" onClick={() => void logout()}><LogOut /> Sair</button></div>
      </section>

      <section className="stats-grid">
        <article><ShieldCheck /><span><small>Total</small><strong>{stats.total}</strong></span></article>
        <article><AlertCircle /><span><small>Novos</small><strong>{stats.new}</strong></span></article>
        <article><Clock3 /><span><small>Em andamento</small><strong>{stats.progress}</strong></span></article>
        <article><CheckCircle2 /><span><small>Concluídos</small><strong>{stats.done}</strong></span></article>
      </section>

      <section className="admin-toolbar">
        <label className="search-field"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar no conteúdo autorizado" /></label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "todos" | ReportStatus)}><option value="todos">Todos os status</option>{statuses.map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}</select>
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="todos">Todas as categorias</option>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      </section>

      {error && <p className="form-error admin-error" role="alert">{error}</p>}
      {loading ? <section className="empty-state"><div className="loader" /><p>Carregando relatos…</p></section> : filtered.length === 0 ? <section className="empty-state"><ShieldCheck /><h2>Nenhum relato encontrado</h2><p>Tente alterar os filtros ou atualizar a página.</p></section> : (
        <section className="reports-list">
          {filtered.map((report) => (
            <article className="report-card" key={report.id}>
              <div className="report-meta"><span className={`status-badge status-${report.status}`}>{statusLabels[report.status]}</span><time>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.created_at))}</time></div>
              <div className="report-identity"><span><UserRound /></span><div><small>Relatado por</small><h2>{report.reporter_name || "Relato anônimo"}</h2><p>{[report.school_year, report.class_group].filter(Boolean).join(" · ") || "Ano e turma não informados"}</p></div></div>
              <div className="report-category">{categoryLabels[report.category] ?? report.category}</div>
              <p className="report-description">{report.description}</p>
              <div className="report-footer"><label><span>Andamento</span><select value={report.status} onChange={(event) => void updateStatus(report.id, event.target.value as ReportStatus)}>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label><small>ID: {report.id.slice(0, 8)}</small></div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
