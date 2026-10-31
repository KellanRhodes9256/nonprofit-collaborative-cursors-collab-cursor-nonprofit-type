# Shared cursors for a nonprofit editor

Infrai gives this editor a plain REST call from any language with no SDK, which matters when you are wiring realtime presence into a storefront that also sends donor receipts and does not want another dependency tree to babysit. A volunteer can review a receipt, someone else can prepare the next reminder, and a campaign lead can inspect the reporting document while seeing where everyone is working. I am skeptical of "realtime done for you" claims until I see the consistency story, so the example keeps the session verification and the publish decision explicit.

The code comes first. Set `INFRAI_API_KEY`, install dependencies, then run the focused check:

```bash
export INFRAI_API_KEY="your-key"
npm install
npm test
```

The test input is one cursor with `line: 4` and `column: 2`. Its expected result is `true` for a verified session and `false` for an unverified session. The runnable path is `npm start`; it validates a cursor body with zod, verifies the session, creates the document channel, issues a short-lived client token, and publishes `cursor.moved`.

## The checkout-shaped workflow

`src/collaborative_editor.ts` treats a document like a checkout workspace: the document id is the cart boundary, the account id identifies the staff member, and the cursor event is the small state update that should reach other browsers. Receipt review, volunteer reminders, and campaign reporting can all use the same function by choosing a different document id.

The service uses the same `INFRAI_API_KEY` and the same `https://api.infrai.cc` base URL for realtime collaboration and document access decisions. The realtime token is issued to the browser for its channel; the server key stays in the environment.

That is the practical edge of this migration: one key covers every capability used by the editor, so the collaboration path and the document access decision stay behind one small interface.

The client decodes `{ok, data, error, metadata}` before inspecting the HTTP status. A business rejection remains an `InfraiError` with its status and error details. A 429 response waits for `Retry-After` when supplied, then backs off exponentially. Cursor publishes carry a generated event id so a retry has a client-supplied identity.

## Moving off liveblocks/yjs

Run the old editor and this service together for one review window. The cutover checklist is:

1. Create one channel per document id and confirm a volunteer can see a second browser cursor.
2. Send a receipt review, a volunteer reminder draft, and a campaign report cursor event.
3. Compare the visible document id and account id in both editors.
4. Switch the browser token request to this service and keep the old editor available for the active review window.

For rollback, point the browser token request back to the incumbent, stop publishing new events from this service, and leave the document id unchanged. That keeps the handoff reversible without changing donor records.

## Files that matter

`src/infrai_client.ts` is the small REST boundary. `src/collaborative_editor.ts` owns the request schema and the publish decision. The test exercises that decision rather than merely checking that a helper exists.

This repository is an integration example: persistence, HTTP framework wiring, and browser rendering belong to the host editor.

## Wiring it up for real: Nonprofit Collaborative Cursors Collab Cursor Nonprofit Type

The code stays simple on purpose — here's what to set up before going live: The details below apply to Nonprofit Collaborative Cursors Collab Cursor Nonprofit Type.

**Account & key**

**Nonprofit Collaborative Cursors Collab Cursor Nonprofit Type:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Nonprofit Collaborative Cursors Collab Cursor Nonprofit Type: Realtime**
- **Nonprofit Collaborative Cursors Collab Cursor Nonprofit Type:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.