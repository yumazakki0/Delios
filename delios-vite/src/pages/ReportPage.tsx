import { useState, type FormEvent } from "react";
import { Check, ChevronLeft, EyeOff, Lock, LogOut, Send, Shield, UserCheck } from "lucide-react";
import { signOut } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth, isFirebaseConfigured } from "../lib/firebase";
import { readApiResponse } from "../lib/apiResponse";
import { categoryLabels } from "../types";

type FormState = {
  category: string;
  description: string;
  privacy_notice_acknowledged: boolean;
};

const initialState: FormState = {
  category: "",
  description: "",
  privacy_notice_acknowledged: false,
};

export function ReportPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  // O relato sai daqui direto para o backend. Identidade e conteúdo viajam separados.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.category) return setError("Escolha a opção que mais se aproxima da situação.");
    if (form.description.trim().length < 20) return setError("Conte um pouco mais. Use pelo menos 20 caracteres.");
    if (!form.privacy_notice_acknowledged) return setError("Confirme que entendeu como sua identidade será protegida.");
    if (!auth?.currentUser) return setError("Sua sessão terminou. Entre novamente.");

    setSubmitting(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch("/api/student/submit-report", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          category: form.category,
          description: form.description.trim(),
          privacyNoticeAcknowledged: true,
        }),
      });
      const data = await readApiResponse<{ error?: string; retryAfterSeconds?: number }>(response);
      if (!response.ok) throw new Error(data.retryAfterSeconds ? `${data.error} Tente novamente em ${data.retryAfterSeconds} segundos.` : data.error);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível enviar agora. Procure a equipe pessoalmente se precisar.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setForm(initialState);
    setSent(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function leaveAccount() {
    if (auth) await signOut(auth);
    navigate("/aluno", { replace: true });
  }

  if (sent) {
    return (
      <main className="form-page">
        <section className="success-card" aria-live="polite">
          <span><Check /></span>
          <p className="eyebrow">Relato enviado</p>
          <h1>Obrigado por confiar na equipe.</h1>
          <p>O conteúdo foi salvo sem exibir sua identidade na fila comum de atendimento.</p>
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
        <p>Você está usando uma conta individual. Seu nome fica separado do relato e não aparece durante o atendimento comum.</p>
        <div className="privacy-box"><EyeOff /><div><strong>Sua identidade fica protegida.</strong><span>Somente a direção pode solicitar a identificação em situações previstas, sempre registrando o motivo.</span></div></div>
        <div className="privacy-box"><Shield /><div><strong>Este formulário não é anônimo.</strong><span>Uso abusivo, riscos à segurança ou necessidade de proteção podem justificar a identificação pela direção.</span></div></div>
        <div className="privacy-box"><UserCheck /><div><strong>Conta autenticada.</strong><span>Não compartilhe sua senha ou código de ativação.</span></div></div>
        {!isFirebaseConfigured && <div className="setup-warning"><Lock /><span>Modo de desenvolvimento: configure o Firebase para ativar o envio.</span></div>}
        <button className="button button-outline student-logout" onClick={() => void leaveAccount()}><LogOut /> Sair da conta</button>
      </section>

      <form className="report-form" onSubmit={handleSubmit}>
        <div className="form-heading"><span>01</span><div><small>Sobre a situação</small><h2>O que mais se aproxima?</h2></div></div>
        <div className="category-grid">
          {Object.entries(categoryLabels).map(([value, label]) => (
            <label className={form.category === value ? "category-option selected" : "category-option"} key={value}>
              <input type="radio" name="category" value={value} checked={form.category === value} onChange={(event) => update("category", event.target.value)} />
              <span>{label}</span>{form.category === value && <Check />}
            </label>
          ))}
        </div>

        <label className="description-field"><span>Descreva o que aconteceu</span><textarea value={form.description} onChange={(event) => update("description", event.target.value)} minLength={20} maxLength={4000} rows={10} placeholder="Você pode contar quando aconteceu, onde, quem estava presente e como isso afetou você. Não precisa usar palavras difíceis." /><small>{form.description.length}/4000 caracteres</small></label>

        <label className="consent-field"><input type="checkbox" checked={form.privacy_notice_acknowledged} onChange={(event) => update("privacy_notice_acknowledged", event.target.checked)} /><span>Entendi que o relato é confidencial, mas não totalmente anônimo, e que a direção poderá solicitar minha identificação nas situações informadas acima.</span></label>

        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary submit-button" type="submit" disabled={submitting}>{submitting ? "Enviando com segurança…" : <>Enviar relato <Send /></>}</button>
        <p className="form-footnote"><Lock /> Nenhum dado é divulgado publicamente.</p>
      </form>
    </main>
  );
}
