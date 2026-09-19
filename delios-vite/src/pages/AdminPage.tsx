import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Inbox,
  LogOut,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { getContentFlags } from "../lib/contentTriage";
import { auth, db } from "../lib/firebase";
import {
  categoryLabels,
  priorityLabels,
  reviewLabels,
  statusLabels,
  type ReportPriority,
  type ReportStatus,
  type ReviewResult,
  type SupportReport,
} from "../types";

const statuses: ReportStatus[] = ["novo", "em_analise", "encaminhado", "concluido"];
const priorities: ReportPriority[] = ["nao_definida", "baixa", "media", "alta"];
type QueueFilter = "todos" | "novos" | "andamento" | "revisar" | "concluidos";

// Um formatador só para a data não decidir virar hieróglifo no meio do expediente.
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function needsContentReview(report: SupportReport, flagCount: number) {
  return report.review_result === "conteudo_inadequado"
    || (report.review_result !== "legitimo" && flagCount > 0);
}

export function AdminPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<SupportReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("novos");
  const [statusFilter, setStatusFilter] = useState<"todos" | ReportStatus>("todos");
  const [categoryFilter, setCategoryFilter] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState<"todos" | ReportPriority>("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  // Nesta parte não tem gracinha: os relatos são dados sensíveis e chegam sem alteração.
  const loadReports = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    setError("");

    try {
      const snapshot = await getDocs(
        query(collection(db, "support_reports"), orderBy("created_at", "desc")),
      );
      const loadedReports = snapshot.docs.map((reportDocument) => {
        const data = reportDocument.data();
        const createdAt = data.created_at as Timestamp | undefined;
        const updatedAt = data.updated_at as Timestamp | undefined;

        return {
          id: reportDocument.id,
          ...data,
          priority: data.priority ?? "nao_definida",
          review_result: data.review_result ?? "pendente",
          internal_notes: data.internal_notes ?? "",
          created_at: createdAt?.toDate().toISOString() ?? new Date().toISOString(),
          updated_at: updatedAt?.toDate().toISOString() ?? new Date().toISOString(),
        } as SupportReport;
      });

      setReports(loadedReports);
    } catch {
      setError("Não foi possível carregar os relatos. Confira a conexão e as regras do Firestore.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  // A fila automática aponta padrões; ela não julga se o relato é verdadeiro.
  const reportsWithTriage = useMemo(
    () => reports.map((report) => ({ report, flags: getContentFlags(report.description) })),
    [reports],
  );

  const stats = useMemo(() => ({
    total: reports.length,
    new: reports.filter((item) => item.status === "novo").length,
    progress: reports.filter((item) => item.status === "em_analise" || item.status === "encaminhado").length,
    review: reportsWithTriage.filter(({ report, flags }) => needsContentReview(report, flags.length)).length,
    done: reports.filter((item) => item.status === "concluido").length,
  }), [reports, reportsWithTriage]);

  // Aqui os filtros fazem uma reunião e, surpreendentemente, chegam a um acordo.
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");

    return reportsWithTriage.filter(({ report, flags }) => {
      const priority = report.priority ?? "nao_definida";
      const matchesQueue =
        queueFilter === "todos"
        || (queueFilter === "novos" && report.status === "novo")
        || (queueFilter === "andamento" && ["em_analise", "encaminhado"].includes(report.status))
        || (queueFilter === "revisar" && needsContentReview(report, flags.length))
        || (queueFilter === "concluidos" && report.status === "concluido");
      const matchesStatus = statusFilter === "todos" || report.status === statusFilter;
      const matchesCategory = categoryFilter === "todos" || report.category === categoryFilter;
      const matchesPriority = priorityFilter === "todos" || priority === priorityFilter;
      const searchable = [
        report.id,
        report.reporter_name,
        report.school_year,
        report.class_group,
        report.description,
      ].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");

      return matchesQueue
        && matchesStatus
        && matchesCategory
        && matchesPriority
        && (!term || searchable.includes(term));
    });
  }, [reportsWithTriage, search, queueFilter, statusFilter, categoryFilter, priorityFilter]);

  const selectedReport = reports.find((report) => report.id === selectedId) ?? null;
  const selectedFlags = selectedReport ? getContentFlags(selectedReport.description) : [];

  function openReport(report: SupportReport) {
    setSelectedId(report.id);
    setNotesDraft(report.internal_notes ?? "");
    setFeedback("");
  }

  // Atualização otimista: a tela responde primeiro e o Firestore confirma logo depois.
  async function updateReport(id: string, changes: Partial<SupportReport>, successMessage: string) {
    if (!db) return;
    const previous = reports;
    const updatedAt = new Date().toISOString();
    setReports((items) => items.map((item) => item.id === id
      ? { ...item, ...changes, updated_at: updatedAt }
      : item));
    setSaving(true);
    setError("");
    setFeedback("");

    try {
      await updateDoc(doc(db, "support_reports", id), {
        ...changes,
        updated_at: serverTimestamp(),
      });
      setFeedback(successMessage);
    } catch {
      setReports(previous);
      setError("A alteração não foi salva. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes() {
    if (!selectedReport) return;
    await updateReport(
      selectedReport.id,
      { internal_notes: notesDraft.trim() },
      "Anotação interna salva.",
    );
  }

  async function logout() {
    if (auth) await signOut(auth);
    navigate("/login", { replace: true });
  }

  return (
    <main className="admin-page">
      <section className="admin-heading">
        <div>
          <p className="eyebrow">Central de atendimento</p>
          <h1>Fila de relatos</h1>
          <p>Abra um ticket, avalie com atenção e registre somente o andamento necessário.</p>
        </div>
        <div className="admin-actions">
          <button className="button button-outline" onClick={() => void loadReports()} disabled={loading}>
            <RefreshCw /> Atualizar
          </button>
          <button className="button button-dark" onClick={() => void logout()}>
            <LogOut /> Sair
          </button>
        </div>
      </section>

      <aside className="human-review-notice">
        <ShieldCheck />
        <div>
          <strong>Decisão humana obrigatória</strong>
          <span>A triagem automática apenas destaca padrões. Nunca descarte uma crítica ou denúncia sem ler o conteúdo.</span>
        </div>
      </aside>

      <section className="stats-grid admin-stats">
        <article><Inbox /><span><small>Total</small><strong>{stats.total}</strong></span></article>
        <article><CircleAlert /><span><small>Aguardando leitura</small><strong>{stats.new}</strong></span></article>
        <article><Clock3 /><span><small>Em andamento</small><strong>{stats.progress}</strong></span></article>
        <article><AlertTriangle /><span><small>Revisar conteúdo</small><strong>{stats.review}</strong></span></article>
        <article><CheckCircle2 /><span><small>Concluídos</small><strong>{stats.done}</strong></span></article>
      </section>

      <nav className="queue-tabs" aria-label="Filas de atendimento">
        {([
          ["novos", "Novos", stats.new],
          ["andamento", "Em andamento", stats.progress],
          ["revisar", "Revisar conteúdo", stats.review],
          ["concluidos", "Concluídos", stats.done],
          ["todos", "Todos", stats.total],
        ] as const).map(([value, label, count]) => (
          <button className={queueFilter === value ? "queue-tab active" : "queue-tab"} key={value} onClick={() => setQueueFilter(value)}>
            {label} <span>{count}</span>
          </button>
        ))}
      </nav>

      <section className="admin-toolbar">
        <label className="search-field">
          <Search />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por conteúdo, identificação ou ID" />
        </label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "todos" | ReportStatus)} aria-label="Filtrar por status">
          <option value="todos">Todos os status</option>
          {statuses.map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}
        </select>
        <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as "todos" | ReportPriority)} aria-label="Filtrar por prioridade">
          <option value="todos">Todas as prioridades</option>
          {priorities.map((priority) => <option value={priority} key={priority}>{priorityLabels[priority]}</option>)}
        </select>
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filtrar por categoria">
          <option value="todos">Todas as categorias</option>
          {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </section>

      {error && <p className="form-error admin-error" role="alert">{error}</p>}

      {loading ? (
        <section className="empty-state"><div className="loader" /><p>Organizando a fila…</p></section>
      ) : (
        <section className={selectedReport ? "admin-workspace detail-open" : "admin-workspace"}>
          <div className="ticket-column">
            <div className="ticket-list-heading">
              <div><strong>{filtered.length} ticket{filtered.length === 1 ? "" : "s"}</strong><span>Selecione um item para abrir</span></div>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state compact"><ShieldCheck /><h2>Fila vazia</h2><p>Nenhum relato corresponde aos filtros.</p></div>
            ) : (
              <div className="ticket-list">
                {filtered.map(({ report, flags }) => {
                  const priority = report.priority ?? "nao_definida";
                  const needsReview = needsContentReview(report, flags.length);

                  return (
                    <button className={selectedId === report.id ? "ticket-item selected" : "ticket-item"} key={report.id} onClick={() => openReport(report)}>
                      <div className="ticket-topline">
                        <span className={`status-badge status-${report.status}`}>{statusLabels[report.status]}</span>
                        <time>{dateFormatter.format(new Date(report.created_at))}</time>
                      </div>
                      <div className="ticket-title-row">
                        <strong>{categoryLabels[report.category] ?? report.category}</strong>
                        <ChevronRight />
                      </div>
                      <p>{report.description}</p>
                      <div className="ticket-tags">
                        <span className={`priority-chip priority-${priority}`}>{priorityLabels[priority]}</span>
                        <span>{report.reporter_name ? "Identificado" : "Anônimo"}</span>
                        {needsReview && <span className="review-chip"><AlertTriangle /> Revisar conteúdo</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedReport ? (
            <article className="ticket-detail" aria-label="Detalhes do relato selecionado">
              <div className="detail-header">
                <div>
                  <span className={`status-badge status-${selectedReport.status}`}>{statusLabels[selectedReport.status]}</span>
                  <small>Ticket #{selectedReport.id.slice(0, 8)}</small>
                </div>
                <button className="button icon-button detail-close" onClick={() => setSelectedId(null)} aria-label="Fechar detalhes"><X /></button>
              </div>

              <h2>{categoryLabels[selectedReport.category] ?? selectedReport.category}</h2>
              <p className="detail-date">Recebido em {dateFormatter.format(new Date(selectedReport.created_at))}</p>

              <section className="detail-identity">
                <span><UserRound /></span>
                <div>
                  <small>Identificação informada</small>
                  <strong>{selectedReport.reporter_name || "Relato anônimo"}</strong>
                  <p>{[selectedReport.school_year, selectedReport.class_group].filter(Boolean).join(" · ") || "Ano e turma não informados"}</p>
                </div>
              </section>

              {selectedFlags.length > 0 && (
                <section className="triage-box">
                  <div><AlertTriangle /><strong>Leitura adicional recomendada</strong></div>
                  <p>Os sinais abaixo não provam que o relato seja falso ou mal-intencionado.</p>
                  <ul>{selectedFlags.map((flag) => <li key={flag.code}><strong>{flag.label}:</strong> {flag.explanation}</li>)}</ul>
                </section>
              )}

              <section className="report-full-text">
                <small>Relato completo</small>
                <p>{selectedReport.description}</p>
              </section>

              <section className="decision-grid">
                <label>
                  <span>Prioridade definida pela equipe</span>
                  <select value={selectedReport.priority ?? "nao_definida"} onChange={(event) => void updateReport(selectedReport.id, { priority: event.target.value as ReportPriority }, "Prioridade atualizada.")} disabled={saving}>
                    {priorities.map((priority) => <option value={priority} key={priority}>{priorityLabels[priority]}</option>)}
                  </select>
                </label>
                <label>
                  <span>Revisão de conteúdo</span>
                  <select value={selectedReport.review_result ?? "pendente"} onChange={(event) => void updateReport(selectedReport.id, { review_result: event.target.value as ReviewResult }, "Classificação atualizada.")} disabled={saving}>
                    {(Object.keys(reviewLabels) as ReviewResult[]).map((result) => <option value={result} key={result}>{reviewLabels[result]}</option>)}
                  </select>
                </label>
              </section>

              <section className="workflow-box">
                <label>
                  <span>Andamento do atendimento</span>
                  <select value={selectedReport.status} onChange={(event) => void updateReport(selectedReport.id, { status: event.target.value as ReportStatus }, "Andamento atualizado.")} disabled={saving}>
                    {statuses.map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}
                  </select>
                </label>
                {selectedReport.status !== "concluido" && (
                  <button className="button button-primary" onClick={() => void updateReport(selectedReport.id, { status: "concluido" }, "Ticket concluído.")} disabled={saving}>
                    <Check /> Marcar como concluído
                  </button>
                )}
              </section>

              <section className="notes-box">
                <label htmlFor="internal-notes">Anotações internas da equipe</label>
                <p>Não copie informações desnecessárias. Este campo também é protegido pelas regras administrativas.</p>
                <textarea id="internal-notes" rows={5} maxLength={2000} value={notesDraft} onChange={(event) => setNotesDraft(event.target.value)} placeholder="Ex.: responsável avisado, atendimento presencial combinado…" />
                <div><small>{notesDraft.length}/2000</small><button className="button button-outline" onClick={() => void saveNotes()} disabled={saving}><Save /> Salvar anotação</button></div>
              </section>

              {feedback && <p className="save-feedback" role="status"><Check /> {feedback}</p>}
            </article>
          ) : (
            <aside className="detail-placeholder">
              <Inbox />
              <h2>Abra um ticket</h2>
              <p>Os detalhes e controles de atendimento aparecerão aqui.</p>
            </aside>
          )}
        </section>
      )}
    </main>
  );
}
