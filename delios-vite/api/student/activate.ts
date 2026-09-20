import { createHash } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "../_lib/firebase-admin.js";
import { allowPost, handleApiError, normalizeUsername, sendJson, studentEmail } from "../_lib/http.js";

function codeHash(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!allowPost(request, response)) return;

  try {
    const username = normalizeUsername(request.body?.username);
    const code = String(request.body?.activationCode ?? "").trim().toUpperCase();
    const password = String(request.body?.password ?? "");
    if (!/^[a-z0-9._-]{3,32}$/.test(username) || code.length < 8 || password.length < 8) {
      return sendJson(response, 400, { error: "Dados de ativação inválidos." });
    }

    const inviteRef = adminDb.collection("student_invites").doc(username);
    const invite = await inviteRef.get();
    const data = invite.data();
    if (!invite.exists || !data?.active || data.claimed || data.activation_code_hash !== codeHash(code)) {
      return sendJson(response, 400, { error: "Usuário ou código de ativação inválido." });
    }

    let user;
    try {
      user = await adminAuth.createUser({ email: studentEmail(username), password, displayName: data.full_name });
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "auth/email-already-exists") {
        return sendJson(response, 409, { error: "Esta conta já foi ativada." });
      }
      throw error;
    }

    try {
      await adminDb.runTransaction(async (transaction) => {
        const freshInvite = await transaction.get(inviteRef);
        if (!freshInvite.exists || freshInvite.data()?.claimed) throw new Error("INVITE_ALREADY_CLAIMED");
        transaction.set(adminDb.collection("students").doc(user.uid), {
          username,
          full_name: data.full_name,
          school_year: data.school_year,
          class_group: data.class_group,
          active: true,
          created_at: FieldValue.serverTimestamp(),
        });
        transaction.update(inviteRef, { claimed: true, claimed_by_uid: user.uid, claimed_at: FieldValue.serverTimestamp(), activation_code_hash: FieldValue.delete() });
      });
    } catch (error) {
      await adminAuth.deleteUser(user.uid);
      if (error instanceof Error && error.message === "INVITE_ALREADY_CLAIMED") return sendJson(response, 409, { error: "Esta conta já foi ativada." });
      throw error;
    }

    const customToken = await adminAuth.createCustomToken(user.uid, { student: true });
    return sendJson(response, 200, { customToken });
  } catch (error) {
    return handleApiError(response, error);
  }
}
