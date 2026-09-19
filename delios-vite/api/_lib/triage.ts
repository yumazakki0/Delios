export type ServerTriageFlag = "link" | "caps" | "repetition" | "low_variety" | "symbol_heavy" | "many_lines";

// O robô aponta a fumaça; quem decide se existe incêndio é uma pessoa capacitada.
export function analyzeContent(content: string): ServerTriageFlag[] {
  const flags: ServerTriageFlag[] = [];
  const trimmed = content.trim();
  const words = trimmed.toLocaleLowerCase("pt-BR").match(/[a-zà-ÿ0-9]+/gi) ?? [];
  const letters = trimmed.match(/[a-zà-ÿ]/gi) ?? [];
  const uppercaseLetters = trimmed.match(/[A-ZÀ-Ý]/g) ?? [];
  const visibleCharacters = trimmed.replace(/\s/g, "");
  const symbolCharacters = visibleCharacters.match(/[^a-zà-ÿ0-9]/gi) ?? [];
  const nonEmptyLines = trimmed.split(/\r?\n/).filter((line) => line.trim()).length;

  if (/https?:\/\/|www\./i.test(trimmed)) flags.push("link");
  if (/(.)\1{7,}/i.test(trimmed)) flags.push("repetition");
  if (letters.length >= 24 && uppercaseLetters.length / letters.length > 0.72) flags.push("caps");
  if (words.length >= 12 && new Set(words).size / words.length < 0.34) flags.push("low_variety");
  if (visibleCharacters.length >= 30 && symbolCharacters.length / visibleCharacters.length > 0.42) flags.push("symbol_heavy");
  if (nonEmptyLines >= 12) flags.push("many_lines");

  return flags;
}
