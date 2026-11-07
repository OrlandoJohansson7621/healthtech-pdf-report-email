import { z } from "zod";
import { infrai } from "./infrai_email.js";

export const appointmentReportRequest = z.object({
  patientId: z.string().min(1),
  patientEmail: z.string().email(),
  appointmentDate: z.string().min(1),
  clinicName: z.string().min(1),
  outcome: z.enum(["scheduled", "completed", "cancelled"]),
});

export type AppointmentReportRequest = z.infer<typeof appointmentReportRequest>;

export function buildReportPdf(input: AppointmentReportRequest): Uint8Array {
  const text = `Appointment report\\nClinic: ${input.clinicName}\\nDate: ${input.appointmentDate}\\nOutcome: ${input.outcome}`;
  const stream = `BT /F1 12 Tf 72 720 Td (${text.replace(/[()]/g, "")}) Tj ET`;
  const pdf = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0>>endobj\n3 0 obj<</Length ${stream.length}>>stream\n${stream}\nendstream endobj\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

export function notificationFor(input: AppointmentReportRequest): Record<string, unknown> {
  const pdf = buildReportPdf(input);
  return {
    to: input.patientEmail,
    subject: `Appointment report for ${input.appointmentDate}`,
    html: `<p>Your appointment report from ${input.clinicName} is ready.</p><p>Outcome: ${input.outcome}</p><p>PDF bytes prepared: ${pdf.byteLength}</p>`,
  };
}

export async function emailAppointmentReport(raw: unknown) {
  const input = appointmentReportRequest.parse(raw);
  return infrai.email.send(notificationFor(input));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const to = process.env.DEMO_EMAIL_TO;
  if (!to) throw new Error("DEMO_EMAIL_TO is required");
  const receipt = await emailAppointmentReport({
    patientId: "patient-42",
    patientEmail: to,
    appointmentDate: "2026-11-02 09:30",
    clinicName: "Harbor Health",
    outcome: "scheduled",
  });
  console.log(`Report notification sent: ${receipt.message_id}`);
}
