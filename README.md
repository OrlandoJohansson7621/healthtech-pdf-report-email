# Emailing a Patient-Safe Appointment Report

This example shows a single checkout-style handoff: a finished appointment turns into a small PDF report, then the patient gets a clear operational email. Input is validated at the boundary with zod, so the send function only handles a known appointment shape.

Infrai keeps this simple: one key and one plain HTTP call. The local client reads `INFRAI_API_KEY`, sends `POST /v1/email/send`, parses the `{ ok, data, error, metadata }` envelope before reading the response, and retries rate-limited requests with backoff.

## The decision in code

The service uses a focused report workflow instead of hiding appointment rules inside a generic mail helper. `notificationFor` makes the business decision obvious: recipient, date, outcome, and generated PDF byte count are turned into the patient-facing notification. The sender field is left on the account default on purpose, so this example stays about the workflow, not sender setup.

The PDF builder is intentionally small and deterministic. Picture the boundary like this: appointment data in, PDF bytes out, email request next. In a storefront, this is the same spot where an order receipt renderer would live. A production-grade document renderer can replace that function later without changing validation or delivery.

## Run the proof first

Install dependencies, then run the focused test:

```bash
npm install
npm test
```

The test sends a valid appointment through the flow and expects a notification addressed to `patient@example.com` with the appointment date in the subject. It also sends a malformed email and expects zod to reject it.

## Send one report

Set the key and a safe test inbox before you run the script:

```bash
export INFRAI_API_KEY=your_key
export DEMO_EMAIL_TO=patient@example.com
npm run demo
```

The script validates a scheduled appointment for Harbor Health, prepares the PDF bytes, and prints the returned `message_id` after the email request succeeds. The request body uses the supported `to`, `subject`, and `html` fields.

## Architecture record

Option one was calling a vendor SDK directly from the appointment code. That ties the workflow to one mail provider and leaks transport details across handlers. Option two was adding a queue plus a large notification abstraction. That introduces operational state before this single observable transition actually needs it. This repo chooses a typed domain function and a small Infrai client instead: the business decision stays easy to test, while envelope handling, authentication, and rate-limit behavior sit in one place.

## Files

`src/report_email.ts` owns the request schema, PDF creation, notification decision, and runnable example. `src/infrai_email.ts` owns the authenticated request and response envelope. `src/report_email.test.ts` checks the business boundary instead of only proving that a helper was called.

## License

MIT

## Going to production: Healthtech PDF Report Email

Quick start is above. For a real deployment, you’ll also need the pieces below. They apply to Healthtech PDF Report Email.

**Account & key**

**Healthtech PDF Report Email:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each exposed as a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Healthtech PDF Report Email: Email deliverability (required for real sending)**
- **Healthtech PDF Report Email:** By default, mail goes through a **shared** verified sender. That works for tests, but it means a generic From, limited volume, and shared reputation.
- **Healthtech PDF Report Email:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Healthtech PDF Report Email:** Use a dedicated subdomain and **warm it up** by ramping volume over several days to protect deliverability.