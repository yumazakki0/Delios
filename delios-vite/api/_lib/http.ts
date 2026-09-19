import type { DecodedIdToken } from "firebase-admin/auth";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminAuth, adminDb } from "./firebase-admin";

export function sendJson(response: VercelResponse, status: number, body: unknown) {
  response.status(status).json(body);
}

export function allowPost(request: VercelRequest, response: VercelResponse) {
  if (request.method === "POST") return true;
  response.setHeader("Allow", "POST");
  sendJson(response, 405, { error: "Método não permitido." });
  return false;
}

export async function requireUser(request: VercelRequest): Promise<DecodedIdToken> {
  const authorization = request.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) throw new Error("UNAUTHORIZED");
  return adminAuth.verifyIdToken(token, true);
}

export async function requireDirector(request: VercelRequest) {
  const user = await requireUser(request);
  const profile = await adminDb.collection("admins").doc(user.uid).get();
  if (!profile.exists || profile.data()?.role !== "director") throw new Error("FORBIDDEN");
  return user;
}

export function normalizeUsername(value: unknown) {
  return String(value ?? "").trim().toLocaleLowerCase("pt-BR");
}

export function studentEmail(username: string) {
  return `${username}@students.delios.local`;
}

export function handleApiError(response: VercelResponse, error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN";
  if (code === "UNAUTHORIZED") return sendJson(response, 401, { error: "Sessão inválida." });
  if (code === "FORBIDDEN") return sendJson(response, 403, { error: "Ação permitida somente para a direção." });
  console.error(error);
  return sendJson(response, 500, { error: "Não foi possível concluir a operação." });
}
