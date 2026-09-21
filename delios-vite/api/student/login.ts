import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAdminAuth, getAdminDb } from "../_lib/firebase-admin.js";
import { allowPost, handleApiError, isValidStudentUsername, normalizeUsername, sendJson } from "../_lib/http.js";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!allowPost(request, response)) return;

  try {
    const username = normalizeUsername(request.body?.username);
    if (!isValidStudentUsername(username)) {
      return sendJson(response, 400, { error: "Usuário inválido. Use o formato 123reg5 ou 3reg5." });
    }

    const adminDb = getAdminDb();
    const studentDoc = await adminDb.collection("students").where("username", "==", username).limit(1).get();
    if (studentDoc.empty) {
      return sendJson(response, 404, { error: "Usuário não encontrado." });
    }

    const student = studentDoc.docs[0];
    if (!student.data()?.active) {
      return sendJson(response, 403, { error: "Esta conta não está ativa." });
    }

    const customToken = await getAdminAuth().createCustomToken(student.id, { student: true });
    return sendJson(response, 200, { customToken });
  } catch (error) {
    return handleApiError(response, error);
  }
}
