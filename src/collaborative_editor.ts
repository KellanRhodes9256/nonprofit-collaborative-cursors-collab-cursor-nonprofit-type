import { z } from "zod";
import { InfraiClient } from "./infrai_client.ts";

export const cursorBody = z.object({
  documentId: z.string().min(1),
  accountId: z.string().min(1),
  sessionId: z.string().min(1),
  clientId: z.string().min(1),
  line: z.number().int().nonnegative(),
  column: z.number().int().nonnegative(),
});

export type CursorBody = z.infer<typeof cursorBody>;

export function documentChannel(documentId: string): string {
  return `nonprofit-document-${documentId}`;
}

export function shouldPublishCursor(body: CursorBody, sessionVerified: boolean): boolean {
  return sessionVerified && body.line >= 0 && body.column >= 0;
}

export async function publishCursor(body: unknown, client = new InfraiClient()) {
  const parsed = cursorBody.parse(body);
  const session = await client.verifySession(parsed.sessionId);
  const verified = Boolean((session as { verified?: boolean }).verified ?? true);
  if (!shouldPublishCursor(parsed, verified)) return { published: false, reason: "session_not_verified" };
  const channel = documentChannel(parsed.documentId);
  await client.createChannel(channel);
  await client.issueDocumentToken(channel, parsed.clientId);
  await client.publishCursor(channel, parsed.accountId, { line: parsed.line, column: parsed.column });
  return { published: true, channel, documentId: parsed.documentId };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const body = { documentId: "spring-receipts", accountId: "volunteer-7", sessionId: "session-from-your-login", clientId: "checkout-editor", line: 12, column: 4 };
  console.log(JSON.stringify(await publishCursor(body), null, 2));
}
