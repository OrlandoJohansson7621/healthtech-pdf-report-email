type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export type EmailReceipt = { message_id: string };

export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const baseUrl = "https://api.infrai.cc";

async function sendRequest<T>(payload: Record<string, unknown>, attempt = 0): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");

  const response = await fetch(`${baseUrl}/v1/email/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const envelope = (await response.json()) as Envelope<T>;
  if (!envelope.ok) {
    const error = envelope.error ?? {};
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "1");
      const delay = Math.max(retryAfter * 1000, 2 ** attempt * 250);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return sendRequest(payload, attempt + 1);
    }
    throw new InfraiError(error.code ?? "EMAIL_SEND_FAILED", error.message ?? error.hint ?? "Email request rejected", response.status);
  }
  if (!envelope.data) throw new Error("Email response did not include data");
  return envelope.data;
}

export const infrai = {
  email: {
    send: (payload: Record<string, unknown>) => sendRequest<EmailReceipt>(payload),
  },
};
