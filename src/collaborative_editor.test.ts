import test from "node:test";
import assert from "node:assert/strict";
import { shouldPublishCursor } from "./collaborative_editor.ts";

test("a verified volunteer cursor is publishable, an unverified session is not", () => {
  const cursor = { documentId: "receipt-review", accountId: "volunteer-7", sessionId: "s1", clientId: "browser-1", line: 4, column: 2 };
  assert.equal(shouldPublishCursor(cursor, true), true);
  assert.equal(shouldPublishCursor(cursor, false), false);
});
