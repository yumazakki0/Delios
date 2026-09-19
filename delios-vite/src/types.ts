export type ReportStatus = "novo" | "em_analise" | "encaminhado" | "concluido";
export type ReportPriority = "nao_definida" | "baixa" | "media" | "alta";
export type ReviewResult = "pendente" | "legitimo" | "conteudo_inadequado";

export type SupportReport = {
  id: string;
  created_at: string;
  updated_at: string;
  reporter_name: string | null;
  school_year: string | null;
  class_group: string | null;
  category: string;
  description: string;
  status: ReportStatus;
  privacy_notice_acknowledged: boolean;
  priority?: ReportPriority;
  review_result?: ReviewResult;
  internal_notes?: string;
};

export const categoryLabels: Record<string, string> = {
  bullying: "Bullying ou humilhação",
  cyberbullying: "Algo aconteceu na internet",
  exclusao: "Exclusão ou isolamento",
  ameaca: "Ameaça ou medo",
  preconceito: "Preconceito ou discriminação",
  conflito: "Conflito com colegas",
  casa: "Problema em casa",
  outro: "Outra situação",
  nao_sei: "Não sei explicar",
};

export const statusLabels: Record<ReportStatus, string> = {
  novo: "Novo",
  em_analise: "Em análise",
  encaminhado: "Encaminhado",
  concluido: "Concluído",
};

export const priorityLabels: Record<ReportPriority, string> = {
  nao_definida: "Não definida",
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export const reviewLabels: Record<ReviewResult, string> = {
  pendente: "Ainda não revisado",
  legitimo: "Relato pertinente",
  conteudo_inadequado: "Possível conteúdo inadequado",
};
