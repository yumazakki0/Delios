import { createHash, randomBytes } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../_lib/firebase-admin";
import { allowPost, handleApiError, normalizeUsername, requireDirector, sendJson } from "../_lib/http";

type StudentInput = { username?: unknown; full_name?: unknown; school_year?: unknown; class_group?: unknown };
const usernamePattern = /^[a-z0-9._-]{3,32}$/;
const codeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function activationCode() {
  const bytes = randomBytes(10);
  return Array.from(bytes, (byte) => codeAlphabet[byte % codeAlphabet.length]).join("");
}

function codeHash(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!allowPost(request, response)) return;

  try {
    const director = await requireDirector(request);
    const rawStudents = Array.isArray(request.body?.students) ? request.body.students as StudentInput[] : [];
    if (!rawStudents.length || rawStudents.length > 800) return sendJson(response, 400, { error: "Envie entre 1 e 800 estudantes por arquivo." });

    const seen = new Set<string>();
    const prepared = rawStudents.map((student, index) => {
      const username = normalizeUsername(student.username);
      const fullName = String(student.full_name ?? "").trim();
      const schoolYear = String(student.school_year ?? "").trim();
      const classGroup = String(student.class_group ?? "").trim();

      if (!usernamePattern.test(username)) throw new Error(`ROW:${index + 2}:nome de usuário inválido`);
      if (seen.has(username)) throw new Error(`ROW:${index + 2}:nome de usuário repetido`);
      if (fullName.length < 3 || fullName.length > 120) throw new Error(`ROW:${index + 2}:nome completo inválido`);
      if (!schoolYear || schoolYear.length > 30 || !classGroup || classGroup.length > 30) throw new Error(`ROW:${index + 2}:ano ou turma inválidos`);
      seen.add(username);

      const code = activationCode();
      return { username, fullName, schoolYear, classGroup, code, hash: codeHash(code) };
    });

    const existing = await Promise.all(prepared.map((student) => adminDb.collection("student_invites").doc(student.username).get()));
    const alreadyClaimed = existing.find((document) => document.exists && document.data()?.claimed === true);
    if (alreadyClaimed) return sendJson(response, 409, { error: `A conta ${alreadyClaimed.id} já foi ativada e não pode ser substituída.` });

    for (let start = 0; start < prepared.length; start += 400) {
      const batch = adminDb.batch();
      for (const student of prepared.slice(start, start + 400)) {
        batch.set(adminDb.collection("student_invites").doc(student.username), {
          username: student.username,
          full_name: student.fullName,
          school_year: student.schoolYear,
          class_group: student.classGroup,
          activation_code_hash: student.hash,
          active: true,
          claimed: false,
          imported_by: director.uid,
          imported_at: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
    }

    return sendJson(response, 200, {
      students: prepared.map(({ username, fullName, schoolYear, classGroup, code }) => ({
        username,
        full_name: fullName,
        school_year: schoolYear,
        class_group: classGroup,
        activation_code: code,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("ROW:")) {
      const [, row, message] = error.message.split(":");
      return sendJson(response, 400, { error: `Linha ${row}: ${message}.` });
    }
    return handleApiError(response, error);
  }
}
