export type ReportStatus = "novo" | "em_analise" | "encaminhado" | "concluido";

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
