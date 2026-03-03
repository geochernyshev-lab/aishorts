# Dubly MVP — AI Video Dubbing Platform

A production-ready Next.js MVP for dubbing short videos using ElevenLabs (voice AI) and SyncLabs (lip-sync).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + CSS variables |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| Storage | Vercel Blob |
| Voice AI | ElevenLabs Dubbing API |
| Lip-sync | SyncLabs API |
| Deploy | Vercel |

---

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd dubly-mvp
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`:

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [clerk.com](https://clerk.com) → API Keys |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (secret!) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Dashboard → Storage → Blob |
| `ELEVENLABS_API_KEY` | [elevenlabs.io](https://elevenlabs.io) → API |
| `SYNCLABS_API_KEY` | [sync.so](https://sync.so) → API |
| `NEXT_PUBLIC_APP_URL` | Your deployment URL (e.g. `https://dubly.vercel.app`) |
| `SYNCLABS_WEBHOOK_SECRET` | Any random secret string |

### 3. Set Up Supabase

Run the SQL in `supabase/schema.sql` in your Supabase SQL Editor.

Optionally create the credit decrement RPC for atomic updates:

```sql
CREATE OR REPLACE FUNCTION decrement_credits(p_clerk_user_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET credits = GREATEST(credits - 1, 0)
  WHERE clerk_user_id = p_clerk_user_id;
END;
$$ LANGUAGE plpgsql;
```

### 4. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
dubly-mvp/
├── app/
│   ├── layout.tsx              # Root layout with ClerkProvider
│   ├── globals.css             # Design tokens + utilities
│   ├── page.tsx                # Landing page
│   ├── sign-in/                # Clerk sign-in page
│   ├── sign-up/                # Clerk sign-up page
│   ├── dashboard/
│   │   ├── layout.tsx          # Sidebar + auth guard
│   │   ├── page.tsx            # Dashboard home + upload
│   │   └── projects/
│   │       └── page.tsx        # Projects list
│   ├── actions.ts              # Server Actions (upload + processVideo)
│   └── api/
│       └── webhooks/
│           └── synclabs/
│               └── route.ts    # SyncLabs webhook receiver
├── components/
│   ├── UploadWidget.tsx        # Drag-and-drop video upload
│   ├── ProjectCard.tsx         # Single project row with actions
│   └── RecentProjects.tsx      # Project list wrapper
├── lib/
│   ├── supabase.ts             # Supabase typed client
│   ├── elevenlabs.ts           # ElevenLabs Dubbing API
│   └── synclabs.ts             # SyncLabs Lip-sync API
├── supabase/
│   └── schema.sql              # Database schema
└── middleware.ts               # Clerk auth middleware
```

---

## Processing Pipeline

```
User uploads video
       │
       ▼
Vercel Blob (store original)
       │
       ▼
ElevenLabs Dubbing API
  → preserves voice + intonation
  → polls until "dubbed" status
       │
       ▼
Dubbed audio → Vercel Blob
       │
       ▼
SyncLabs API (lip-sync job)
  → webhookUrl = /api/webhooks/synclabs
       │
       ▼
SyncLabs Webhook fires
  → updates result_url in Supabase
  → deducts 1 credit from user
```

---

## Webhook Setup for SyncLabs

In your SyncLabs dashboard, set the webhook URL to:

```
https://your-domain.com/api/webhooks/synclabs
```

Set `SYNCLABS_WEBHOOK_SECRET` to match the signature SyncLabs sends.

---

## Deploy to Vercel

```bash
vercel deploy
```

Add all environment variables in Vercel Dashboard → Project → Settings → Environment Variables.

Make sure to enable Vercel Blob storage in your project.

---

## Credits System

- New users receive **3 free credits** on first sign-in
- Each completed dubbing job costs **1 credit**
- Credits are deducted atomically via Supabase when the webhook fires
- Failed jobs do **not** deduct credits

---

## License

MIT
