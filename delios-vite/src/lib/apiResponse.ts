type ApiErrorBody = { error?: string };

export async function readApiResponse<T extends ApiErrorBody>(response: Response): Promise<T> {
  const raw = await response.text();

  if (!raw.trim()) {
    return { error: `O servidor respondeu sem conteúdo (HTTP ${response.status}).` } as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    // Se a função cair, a Vercel pode devolver texto ou HTML. Nada de explodir com "Unexpected token".
    return {
      error: `A função do servidor retornou uma resposta inválida (HTTP ${response.status}). Confira os logs do deploy.`,
    } as T;
  }
}
