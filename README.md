# TLF Partners — AI Support Hub (MVP)

Internal, AI-powered omnichannel support inbox for TLF Partners. All client
messages (email / phone / chat — **mocked** in this MVP) land in one queue. For
each message the system retrieves relevant firm knowledge (SOP / FAQ) and
auto-generates a **RAG-grounded draft reply** with source citations and a
confidence score. A staff member reviews, edits, regenerates, escalates, and
"sends" — human-in-the-loop on every reply.

## Stack

- **Next.js** (App Router, TypeScript) + **Tailwind v4** — deploy on Vercel
- **Supabase Postgres + pgvector** via **Drizzle ORM**
- **Anthropic Claude** (`claude-opus-4-8`) for drafting + **OpenAI** embeddings
  (`text-embedding-3-small`), behind a swappable `lib/ai` service layer
- **NextAuth** (Credentials) seeded login; knowledge uploads are parsed and
  stored directly in Supabase Postgres

> The AI layer **degrades gracefully without API keys** — embeddings fall back to
> a deterministic local vector and drafting to a grounded template — so the inbox
> is demoable before keys are provisioned. Add `ANTHROPIC_API_KEY` +
> `OPENAI_API_KEY` for real draft quality and semantic retrieval.

## Setup

1. Copy env and fill in values:
   ```bash
   cp .env.example .env.local
   ```
   At minimum set `DATABASE_URL` (Supabase) and `AUTH_SECRET` (`openssl rand -base64 32`).
   Add `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` for live AI.

2. Install, apply schema (creates the `vector` extension + tables), seed:
   ```bash
   pnpm install
   pnpm db:migrate      # or: pnpm db:push
   pnpm db:seed         # 10 clients, 21 conversations, SOP/FAQ KB, drafts
   pnpm dev
   ```

3. Sign in at http://localhost:3000 with a seeded user, e.g.
   `gary@tlfpartners.com.au` / `password`.

### Local Postgres (no Supabase yet)

```bash
docker run -d --name tlf-pg -e POSTGRES_PASSWORD=postgres -p 5433:5432 pgvector/pgvector:pg16
# DATABASE_URL="postgres://postgres:postgres@localhost:5433/postgres"
```

## Screens

Login · Inbox (filterable) · Ticket board (Kanban workflow) · Conversation
(thread + client panel + AI draft with citations/confidence, edit / regenerate /
approve & send / escalate / reassign) · Knowledge base (upload + ingest) ·
Channels (mock) · Dashboard.

## Production connections

- **Database:** Supabase Postgres with `pgvector`, exposed through `DATABASE_URL`.
- **Auth:** a strong `AUTH_SECRET` and the deployed `NEXTAUTH_URL`.
- **Drafting:** `ANTHROPIC_API_KEY` for Claude draft generation.
- **Embeddings:** `OPENAI_API_KEY` for semantic knowledge retrieval.
- **Uploads:** no separate blob store is required; uploads are extracted,
  chunked, embedded, and stored in Supabase Postgres.
- **Real channels:** connect email, phone/SMS, and chat providers when moving
  beyond mocked inbound conversations.
- **Firm knowledge:** replace the seeded SOP/FAQ placeholders with Gary's real
  TLF procedures before relying on live client replies.

## Scripts

| Script | Purpose |
|---|---|
| `pnpm dev` / `pnpm build` | Run / build the app |
| `pnpm db:generate` | Generate a Drizzle migration from the schema |
| `pnpm db:migrate` / `pnpm db:push` | Apply schema to the database |
| `pnpm db:seed` | Reset + seed mock data and generate drafts |

## Not in this MVP (Phase 2+)

Live email/phone/chat providers, client-facing bot, autonomous sending,
Carbon HQ / XPM / Super Mate connectors, multi-tenant/billing/SSO, the
document-automation (engagement-letter) module.
