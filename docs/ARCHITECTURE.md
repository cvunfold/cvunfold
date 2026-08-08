# Architecture

Flow: browser uploads a file to a server route; server validates type/size/signature, parses text, masks contact PII, constructs an evidence map, requests structured review, validates evidence references and weights, stores the full report, deletes the source, then returns only a teaser. A random token is delivered to the user; only its SHA-256 hash is persisted.

The mock store is process-local for a zero-access vertical slice. Production swaps it for Supabase using the checked-in migration. There are no browser-facing RLS policies. Full report access always requires token validation plus a paid status read on the server.

Stripe production will use Checkout Sessions, signed webhook verification and the `webhook_events` table for idempotency. Success query parameters never unlock access.

AI parsing/review model names come only from `OPENAI_EXTRACTION_MODEL` and `OPENAI_REVIEW_MODEL`. CV and job descriptions are untrusted data. The final score is always calculated in code.
