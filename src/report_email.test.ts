import assert from "node:assert/strict";
import { appointmentReportRequest, notificationFor } from "./report_email.js";

const valid = {
  patientId: "patient-42",
  patientEmail: "patient@example.com",
  appointmentDate: "2026-11-02 09:30",
  clinicName: "Harbor Health",
  outcome: "scheduled" as const,
};

const message = notificationFor(valid);
assert.equal(message.to, valid.patientEmail);
assert.match(String(message.subject), /2026-11-02/);
assert.match(String(message.html), /PDF bytes prepared: [1-9]/);
assert.throws(() => appointmentReportRequest.parse({ ...valid, patientEmail: "bad" }));
console.log("appointment report boundary: valid input is notified and invalid email is rejected");
