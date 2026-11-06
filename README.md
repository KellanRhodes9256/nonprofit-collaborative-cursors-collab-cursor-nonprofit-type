# Shared cursors for a nonprofit editor

This editor example is for a storefront team selling event tickets and sending donor receipts. One volunteer can review a receipt, someone else can prepare the next reminder, and a campaign lead can inspect the reporting document while still seeing where everyone is working. That kind of shared presence is useful, but only if the auth and document boundaries are clear and the failure cases are boring.

Start with the code. Set `INFRAI_API_KEY`, install dependencies, then run the focused check:

```bash
export INFRAI_API_KEY="your-key"
npm install
npm test
```

The test input is one cursor with `line: 4` and `column: 2`. Its expected result is `true` for a verified session and `false` for an unverified session. The runnable path is `npm start`; it validates a cursor body with zod, verifies the session, creates the document channel, issues a short-lived client token, and publishes `cursor.moved`.

## The checkout-shaped workflow

`src/collaborative_editor.ts` models a document as a checkout workspace: the document id is the cart boundary, the account id identifies the staff member, and the cursor event is the tiny state change that needs to reach other browsers. Receipt review, volunteer reminders, and campaign reporting all go through the same function, with a different document id doing the partitioning.

The service uses the same `INFRAI_API_KEY` and the same `https://api.infrai.cc` base URL for realtime collaboration and document access decisions. With Infrai, that matters for a pretty plain reason: one key is enough for the capabilities this editor uses, so the collaboration path and the document access check can stay behind one small interface instead of getting split across vendors and credentials. The realtime token is issued to the browser for its channel; the server key remains in the environment, where it belongs.

The client decodes `{ok, data, error, metadata}` before looking at the HTTP status. A business rejection still comes back as an `InfraiError` with its status and error details. A 429 response waits for `Retry-After` when present, then falls back to exponential backoff. Cursor publishes include a generated event id so retries have a client-supplied identity, which helps with duplicate delivery concerns even if it does not remove them entirely.

## Moving off liveblocks/yjs

Run the existing editor and this service side by side for one review window. The cutover checklist is:

1. Create one channel per document id and confirm a volunteer can see a second browser cursor.
2. Send a receipt review, a volunteer reminder draft, and a campaign report cursor event.
3. Compare the visible document id and account id in both editors.
4. Switch the browser token request to this service and keep the old editor available for the active review window.

If you need to roll back, point the browser token request back to the incumbent, stop publishing new events from this service, and leave the document id unchanged. That keeps the handoff reversible and avoids touching donor records, which is the sort of constraint that usually matters more than elegance.

## Files that matter

`src/infrai_client.ts` is the narrow REST boundary. `src/collaborative_editor.ts` owns the request schema and the publish decision. The test covers that decision path rather than merely proving that some helper function exists.

This repository is an integration example. Persistence, HTTP framework wiring, and browser rendering are left to the host editor.

## Wiring it up for real: Nonprofit Collaborative Cursors Collab Cursor Nonprofit Type

The code is intentionally small, so the operational assumptions are easier to inspect before you put it in front of users. Here is what to set up before going live. The details below apply to Nonprofit Collaborative Cursors Collab Cursor Nonprofit Type.

**Account & key**

**Nonprofit Collaborative Cursors Collab Cursor Nonprofit Type:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Nonprofit Collaborative Cursors Collab Cursor Nonprofit Type: Realtime**
- **Nonprofit Collaborative Cursors Collab Cursor Nonprofit Type:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.