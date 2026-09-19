export type ContentFlag = {
  code: "link" | "caps" | "repetition" | "low_variety";
  label: string;
  explanation: string;
};

// A lenda diz que alguém tentou resolver moderação com uma lista infinita de palavrões.
// Aqui a gente observa padrões, porque contexto vale mais do que caçar palavras soltas.
export function getContentFlags(content: string): ContentFlag[] {
  const flags: ContentFlag[] = [];
  const trimmed = content.trim();
  const words = trimmed.toLocaleLowerCase("pt-BR").match(/[a-zà-ÿ0-9]+/gi) ?? [];
  const letters = trimmed.match(/[a-zà-ÿ]/gi) ?? [];
  const uppercaseLetters = trimmed.match(/[A-ZÀ-Ý]/g) ?? [];

  if (/https?:\/\/|www\./i.test(trimmed)) {
    flags.push({ code: "link", label: "Contém link", explanation: "Abra links somente se a política da escola permitir e se a origem for conhecida." });
  }

  if (/(.)\1{7,}/i.test(trimmed)) {
    flags.push({ code: "repetition", label: "Repetição exagerada", explanation: "O texto contém uma sequência longa do mesmo caractere." });
  }

  if (letters.length >= 24 && uppercaseLetters.length / letters.length > 0.72) {
    flags.push({ code: "caps", label: "Maioria em caixa-alta", explanation: "Pode ser apenas a forma de escrita do aluno; faça a leitura antes de classificar." });
  }

  if (words.length >= 12 && new Set(words).size / words.length < 0.34) {
    flags.push({ code: "low_variety", label: "Texto muito repetitivo", explanation: "Poucas palavras diferentes aparecem várias vezes." });
  }

  return flags;
}
