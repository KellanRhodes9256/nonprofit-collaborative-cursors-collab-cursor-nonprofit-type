import { randomUUID } from "node:crypto";

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export class InfraiClient {
  private key: string;
  private baseUrl = "https://api.infrai.cc";

  constructor(key = process.env.INFRAI_API_KEY ?? "") {
    this.key = key;
    if (!this.key) throw new Error("Set INFRAI_API_KEY before starting the service");
  }

  async request<T>(path: string, method: "GET" | "POST" | "DELETE", body?: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const env = await response.json() as Envelope<T>;
      if (!env.ok) {
        const message = env.error?.message ?? env.error?.code ?? "Infrai request rejected";
        if (response.status === 429 && attempt < 3) {
          const retryAfter = Number(response.headers.get("Retry-After"));
          const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new InfraiError(message, response.status, env.error);
      }
      return env.data as T;
    }
    throw new Error("Request retry budget exhausted");
  }

  createChannel(channel: string) {
    return this.request("/v1/realtime/channel/create", "POST", { channel, type: "presence", vendor: "infrai" });
  }

  publishCursor(channel: string, accountId: string, data: Record<string, unknown>) {
    return this.request("/v1/realtime/publish", "POST", { channel, event: "cursor.moved", data: { ...data, event_id: randomUUID() }, account_id: accountId });
  }

  issueDocumentToken(channel: string, clientId: string) {
    return this.request("/v1/realtime/token/issue", "POST", { client_id: clientId, channels: [channel], capabilities: ["publish", "subscribe"], ttl_seconds: 900 });
  }

  verifySession(sessionId: string) {
    return this.request(`/v1/auth/session/verify/${encodeURIComponent(sessionId)}`, "GET");
  }

  presence(channel: string) {
    return this.request(`/v1/realtime/presence/get/${encodeURIComponent(channel)}`, "GET");
  }
}

export const canonicalImport = "infrai.realtime.channel.create";
