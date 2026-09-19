import { useState, type FormEvent } from "react";
import { Check, ChevronLeft, EyeOff, Lock, Send, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { categoryLabels } from "../types";

type FormState = {
  reporter_name: string;
  school_year: string;
  class_group: string;
  category: string;
  description: string;
  privacy_notice_acknowledged: boolean;
};

const initialState: FormState = {
  reporter_name: "",
  school_year: "",
  class_group: "",
  category: "",
  description: "",
  privacy_notice_acknowledged: false,
};

export function ReportPage() {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.category) return setError("Escolha a opção que mais se aproxima da situação.");
    if (form.description.trim().length < 20) return setError("Conte um pouco mais. Use pelo menos 20 caracteres.");
    if (!form.privacy_notice_acknowledged) return setError("Confirme que entendeu como o relato será protegido.");
    if (!supabase) return setError("O banco ainda não foi configurado. Siga o arquivo SETUP_SUPABASE.md.");

    setSubmitting(true);
    const { error: insertError } = await supabase.from("support_reports").insert({
      reporter_name: form.reporter_name.trim() || null,
      school_year: form.school_year || null,
      class_group: form.class_group.trim() || null,
      category: form.category,
      description: form.description.trim(),
      privacy_notice_acknowledged: true,
    });
    setSubmitting(false);

    if (insertError) {
      setError("Não foi possível enviar agora. Tente novamente ou procure a equipe da escola pessoalmente.");
      return;
    }

    setForm(initialState);
    setSent(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (sent) {
    return (
      <main className="form-page">
        <section className="success-card" aria-live="polite">
          <span><Check /></span>
          <p className="eyebrow">Relato enviado</p>
          <h1>Obrigado por confiar na equipe.</h1>
          <p>Seu relato foi salvo e ficará disponível apenas na área administrativa protegida.</p>
          <div className="success-actions">
            <button className="button button-primary" onClick={() => setSent(false)}>Enviar outro relato</button>
            <Link className="button button-outline" to="/">Voltar ao início</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="form-page">
      <section className="form-intro">
        <Link to="/" className="back-link"><ChevronLeft /> Voltar</Link>
        <p className="eyebrow eyebrow-light">Relato confidencial</p>
        <h1>Conte o que aconteceu do seu jeito.</h1>
        <p>Nome, ano e turma são opcionais. Você pode deixar os três campos vazios e enviar o relato anonimamente.</p>
        <div className="privacy-box"><EyeOff /><div><strong>Outros alunos não verão seu relato.</strong><span>Somente a equipe autorizada terá acesso ao painel.</span></div></div>
        <div className="privacy-box"><Shield /><div><strong>Não prometemos segredo absoluto.</strong><span>Se for preciso proteger alguém, a escola poderá encaminhar informações às pessoas responsáveis pelo atendimento.</span></div></div>
        {!isSupabaseConfigured && <div className="setup-warning"><Lock /><span>Modo de desenvolvimento: configure o Supabase para ativar o envio.</span></div>}
      </section>

      <form className="report-form" onSubmit={handleSubmit}>
        <div className="form-heading"><span>01</span><div><small>Identificação opcional</small><h2>Como podemos reconhecer você?</h2></div></div>
        <div className="field-grid three-fields">
          <label><span>Nome <small>opcional</small></span><input value={form.reporter_name} onChange={(event) => update("reporter_name", event.target.value)} maxLength={120} placeholder="Como prefere ser chamado" /></label>
          <label><span>Ano <small>opcional</small></span><select value={form.school_year} onChange={(event) => update("school_year", event.target.value)}><option value="">Não informar</option>{["6º ano", "7º ano", "8º ano", "9º ano", "1º ano EM", "2º ano EM", "3º ano EM"].map((year) => <option key={year}>{year}</option>)}</select></label>
          <label><span>Turma <small>opcional</small></span><input value={form.class_group} onChange={(event) => update("class_group", event.target.value)} maxLength={30} placeholder="Ex.: A ou 8º B" /></label>
        </div>

        <div className="form-divider" />
        <div className="form-heading"><span>02</span><div><small>Sobre a situação</small><h2>O que mais se aproxima?</h2></div></div>
        <div className="category-grid">
          {Object.entries(categoryLabels).map(([value, label]) => (
            <label className={form.category === value ? "category-option selected" : "category-option"} key={value}>
              <input type="radio" name="category" value={value} checked={form.category === value} onChange={(event) => update("category", event.target.value)} />
              <span>{label}</span>{form.category === value && <Check />}
            </label>
          ))}
        </div>

        <label className="description-field"><span>Descreva o que aconteceu</span><textarea value={form.description} onChange={(event) => update("description", event.target.value)} minLength={20} maxLength={4000} rows={8} placeholder="Você pode contar quando aconteceu, onde, quem estava presente e como isso afetou você. Não precisa usar palavras difíceis." /><small>{form.description.length}/4000 caracteres</small></label>

        <label className="consent-field"><input type="checkbox" checked={form.privacy_notice_acknowledged} onChange={(event) => update("privacy_notice_acknowledged", event.target.checked)} /><span>Entendi que o relato é confidencial, mas pode ser encaminhado à equipe responsável quando isso for necessário para proteger alguém.</span></label>

        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary submit-button" type="submit" disabled={submitting}>{submitting ? "Enviando…" : <>Enviar relato <Send /></>}</button>
        <p className="form-footnote"><Lock /> Nenhum dado é divulgado publicamente.</p>
      </form>
    </main>
  );
}
