import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "../_lib/firebase-admin";
import { allowPost, handleApiError, requireDirector, sendJson } from "../_lib/http";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!allowPost(request, response)) return;

  try {
    const director = await requireDirector(request);
    const reportId = String(request.body?.reportId ?? "").trim();
    const reason = String(request.body?.reason ?? "").trim();
    if (!/^[a-zA-Z0-9]{10,40}$/.test(reportId) || reason.length < 20 || reason.length > 500) {
      return sendJson(response, 400, { error: "Informe uma justificativa clara com pelo menos 20 caracteres." });
    }

    const report = await adminDb.collection("support_reports").doc(reportId).get();
    if (!report.exists) return sendJson(response, 404, { error: "Relato não encontrado." });
    if (report.data()?.review_result !== "conteudo_inadequado") {
      return sendJson(response, 409, { error: "O profissional precisa classificar o conteúdo como inadequado antes da identificação." });
    }

    const link = await adminDb.collection("report_identity_links").doc(reportId).get();
    const studentUid = link.data()?.student_uid as string | undefined;
    if (!studentUid) return sendJson(response, 404, { error: "Este relato não possui vínculo de identidade." });
    const student = await adminDb.collection("students").doc(studentUid).get();
    if (!student.exists) return sendJson(response, 404, { error: "Cadastro estudantil não encontrado." });

    await adminDb.collection("identity_access_logs").add({
      report_id: reportId,
      student_uid: studentUid,
      director_uid: director.uid,
      director_email: director.email ?? null,
      reason,
      accessed_at: FieldValue.serverTimestamp(),
    });

    const data = student.data()!;
    return sendJson(response, 200, {
      identity: {
        fullName: data.full_name,
        username: data.username,
        schoolYear: data.school_year,
        classGroup: data.class_group,
      },
    });
  } catch (error) {
    return handleApiError(response, error);
  }
}
