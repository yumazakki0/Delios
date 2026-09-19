export type SanitizedReportForm = {
  reporter_name: string | null;
  school_year: string | null;
  class_group: string | null;
  category: string;
  description: string;
  privacy_notice_acknowledged: boolean;
};

const REPORT_SUBMIT_KEY = "delios_last_report_submission";
const REPORT_SUBMIT_COOLDOWN_MS = 30_000;

export function sanitizeText(value: string, maxLength = 4000): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function normalizeReportForm(input: {
  reporter_name: string;
  school_year: string;
  class_group: string;
  category: string;
  description: string;
  privacy_notice_acknowledged: boolean;
}): SanitizedReportForm {
  return {
    reporter_name: sanitizeText(input.reporter_name, 120) || null,
    school_year: sanitizeText(input.school_year, 30) || null,
    class_group: sanitizeText(input.class_group, 30) || null,
    category: input.category.trim(),
    description: sanitizeText(input.description, 4000),
    privacy_notice_acknowledged: Boolean(input.privacy_notice_acknowledged),
  };
}

export function validateReportForm(input: {
  reporter_name: string;
  school_year: string;
  class_group: string;
  category: string;
  description: string;
  privacy_notice_acknowledged: boolean;
}): string | null {
  const normalized = normalizeReportForm(input);

  const allowedCategories = new Set([
    "bullying",
    "cyberbullying",
    "exclusao",
    "ameaca",
    "preconceito",
    "conflito",
    "casa",
    "outro",
    "nao_sei",
  ]);

  if (!normalized.category || !allowedCategories.has(normalized.category)) {
    return "Escolha a opção que mais se aproxima da situação.";
  }

  if (!normalized.privacy_notice_acknowledged) {
    return "Confirme que entendeu como o relato será protegido.";
  }

  if (normalized.description.length < 20) {
    return "Conte um pouco mais. Use pelo menos 20 caracteres.";
  }

  if (normalized.description.length > 4000) {
    return "O relato está muito longo. Limite a descrição a 4000 caracteres.";
  }

  const repeatedChars = /(.)\1{8,}/i.test(normalized.description);
  if (repeatedChars) {
    return "O texto contém sequências repetidas demais. Revise a descrição antes de enviar.";
  }

  const repeatedWords = normalized.description.toLowerCase().match(/\b(\w+)\b/g)?.filter(Boolean) ?? [];
  if (repeatedWords.length >= 20) {
    const uniqueWords = new Set(repeatedWords);
    if (uniqueWords.size / repeatedWords.length < 0.35) {
      return "O texto parece ser repetitivo demais. Escreva a situação com mais detalhes e menos repetições.";
    }
  }

  if ((normalized.reporter_name?.length ?? 0) > 120) {
    return "O nome informado está muito longo.";
  }

  if ((normalized.school_year?.length ?? 0) > 30) {
    return "O ano escolar informado é muito longo.";
  }

  if ((normalized.class_group?.length ?? 0) > 30) {
    return "A turma informada é muito longa.";
  }

  return null;
}

export function getReportSubmissionCooldownRemainingMs(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    const rawValue = window.localStorage.getItem(REPORT_SUBMIT_KEY);
    if (!rawValue) {
      return 0;
    }

    const submittedAt = Number(rawValue);
    if (!Number.isFinite(submittedAt)) {
      return 0;
    }

    const elapsed = Date.now() - submittedAt;
    return Math.max(0, REPORT_SUBMIT_COOLDOWN_MS - elapsed);
  } catch {
    return 0;
  }
}

export function canSubmitReport(): boolean {
  return getReportSubmissionCooldownRemainingMs() === 0;
}

export function markReportSubmitted(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(REPORT_SUBMIT_KEY, String(Date.now()));
  } catch {
    // O navegador pode bloquear o armazenamento em alguns cenários. O envio continua.
  }
}
