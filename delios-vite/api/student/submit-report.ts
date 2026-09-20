import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "../_lib/firebase-admin.js";
import { allowPost, handleApiError, requireUser, sendJson } from "../_lib/http.js";
import { analyzeContent } from "../_lib/triage.js";

const categories = new Set(["bullying", "cyberbullying", "exclusao", "ameaca", "preconceito", "conflito", "casa", "outro", "nao_sei"]);
const minimumIntervalSeconds = 45;

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!allowPost(request, response)) return;

  try {
    const user = await requireUser(request);
    const category = String(request.body?.category ?? "");
    const description = String(request.body?.description ?? "").trim();
    const privacyAcknowledged = request.body?.privacyNoticeAcknowledged === true;
    if (!categories.has(category) || description.length < 20 || description.length > 4000 || !privacyAcknowledged) {
      return sendJson(response, 400, { error: "Revise os campos do relato." });
    }

    const studentRef = adminDb.collection("students").doc(user.uid);
    const student = await studentRef.get();
    if (!student.exists || student.data()?.active !== true) return sendJson(response, 403, { error: "Conta estudantil não autorizada." });

    const reportRef = adminDb.collection("support_reports").doc();
    const identityRef = adminDb.collection("report_identity_links").doc(reportRef.id);
    const rateRef = adminDb.collection("submission_rate_limits").doc(user.uid);
    const flags = analyzeContent(description);

    await adminDb.runTransaction(async (transaction) => {
      const rate = await transaction.get(rateRef);
      const lastSubmission = rate.data()?.last_submitted_at as Timestamp | undefined;
      if (lastSubmission) {
        const elapsed = Math.floor((Date.now() - lastSubmission.toMillis()) / 1000);
        if (elapsed < minimumIntervalSeconds) throw new Error(`RATE_LIMIT:${minimumIntervalSeconds - elapsed}`);
      }

      transaction.set(reportRef, {
        reporter_name: null,
        school_year: null,
        class_group: null,
        category,
        description,
        status: "novo",
        privacy_notice_acknowledged: true,
        priority: "nao_definida",
        review_result: "pendente",
        internal_notes: "",
        triage_flags: flags,
        identity_protected: true,
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });
      transaction.set(identityRef, { student_uid: user.uid, created_at: FieldValue.serverTimestamp() });
      transaction.set(rateRef, { last_submitted_at: FieldValue.serverTimestamp() });
    });

    return sendJson(response, 200, { reportId: reportRef.id, triageReview: flags.length > 0 });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("RATE_LIMIT:")) {
      return sendJson(response, 429, { error: "Aguarde um pouco antes de enviar outro relato.", retryAfterSeconds: Number(error.message.split(":")[1]) });
    }
    return handleApiError(response, error);
  }
}
