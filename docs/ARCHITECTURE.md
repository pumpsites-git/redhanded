# RedHanded — Production Architecture Review & Plan

## Senior Engineer Assessment of Current State

### What Works
- **Pipeline architecture** — Clean `pipeline/pipeline.py` → `data/master/` flow. Idempotent, validated, one command.
- **Data volume** — 4.5M+ records across 3 states + federal. Real data, not mock.
- **Dark theme UI** — Consistent, professional look. Red accent works for the brand.
- **Static generation** — 236 judge pages pre-rendered at build time. Fast.

### What's Wrong

#### 1. No Database (Critical)
The entire app reads from static JSON files imported at build time. This means:
- **No user accounts, no auth, no bounties, no submissions** — impossible without a DB
- **No search API** — client loads ALL 9,396 federal judges into memory
- **No real-time updates** — every data change requires a full rebuild + redeploy
- Supabase client exists in `src/lib/supabase.ts` but only the federal judges page uses it, and even that falls back to static JSON

#### 2. Inline Styles Everywhere (Tech Debt)
Every component uses `style={{}}` objects — 13,000 lines of inline CSS. No Tailwind despite it being installed. Makes the codebase 3x larger than needed and impossible to maintain responsive design properly.

#### 3. No API Layer
Everything is client-side or static. No `/api` routes. The Solana bounty system needs:
- Auth endpoints (wallet verification)
- Bounty CRUD
- Submission upload + validation
- Payment processing

#### 4. No Mobile Responsiveness
Inline styles don't adapt. Tables break on mobile. The nav doesn't collapse.

#### 5. Duplicated Data Paths
Despite the pipeline, there are still remnants:
- `src/data/judges.json` (old, 9,396 judges)
- `data/master/federal-judges.json` (pipeline output)
- `data/state-courts/` (legacy, partially used)
- `data/ussc/` (federal district stats, still imported directly)

#### 6. No Error Handling
Pages crash silently if data is malformed. No error boundaries, no fallbacks.

---

## Production Architecture

### Tech Stack
| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 16 (App Router) | Already using, SSR + SSG |
| Styling | Tailwind CSS 4 | Already installed, not used |
| Database | Supabase (Postgres) | Already configured, free tier |
| Auth | Solana wallet (Phantom/Solflare) + Supabase Auth | Web3 native for bounties |
| Payments | Solana (USDC-SPL) | Bryan's choice |
| File Storage | Supabase Storage | Bounty evidence uploads |
| Deployment | Vercel | Free, automatic |
| Pipeline | Python (existing) | Data processing |

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      USERS                               │
│  Visitors (browse) │ Hunters (bounties) │ Admin (Bryan)  │
└──────────┬─────────┴──────────┬─────────┴───────┬───────┘
           │                    │                  │
┌──────────▼────────────────────▼──────────────────▼───────┐
│                    NEXT.JS APP                            │
│                                                           │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────────┐  │
│  │ Public Pages │ │ Bounty Board │ │ Admin Dashboard   │  │
│  │ (SSG/SSR)   │ │ (Auth'd)     │ │ (Owner only)      │  │
│  └──────┬──────┘ └──────┬───────┘ └────────┬──────────┘  │
│         │               │                   │             │
│  ┌──────▼───────────────▼───────────────────▼──────────┐  │
│  │              API Routes (/api)                       │  │
│  │  /api/judges    /api/bounties    /api/auth           │  │
│  │  /api/search    /api/submit      /api/admin          │  │
│  │  /api/stats     /api/payments    /api/pipeline       │  │
│  └──────────────────────┬──────────────────────────────┘  │
└─────────────────────────┼────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────┐
│                    SUPABASE                                │
│                                                            │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐  │
│  │ Postgres │ │   Auth   │ │ Storage │ │ Edge Funcs   │  │
│  │          │ │ (wallet) │ │ (files) │ │ (webhooks)   │  │
│  └──────────┘ └──────────┘ └─────────┘ └──────────────┘  │
└──────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────┐
│                 DATA PIPELINE (Server)                     │
│                                                            │
│  data/raw/ ──→ pipeline.py ──→ data/master/ ──→ DB sync   │
│  data/incoming/ (bounty submissions) ──→ validate ──→ DB  │
└──────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────┐
│                    SOLANA                                  │
│                                                            │
│  Program: Bounty escrow (USDC-SPL)                        │
│  Flow: Fund bounty → Hunter claims → Submit → Verify →   │
│        Release USDC to hunter wallet                      │
└──────────────────────────────────────────────────────────┘
```

### File Structure

```
redhanded/
├── public/
│   └── favicon.svg
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout with nav
│   │   ├── globals.css                   # Tailwind + custom vars
│   │   ├── page.tsx                      # Homepage — judge leaderboard
│   │   ├── (public)/                     # Public routes (no auth)
│   │   │   ├── judges/
│   │   │   │   ├── [slug]/page.tsx       # Individual judge profile
│   │   │   │   └── page.tsx              # Browse all judges
│   │   │   ├── federal/
│   │   │   │   ├── [id]/page.tsx         # Federal judge profile
│   │   │   │   └── page.tsx              # Federal judges browser
│   │   │   ├── counties/
│   │   │   │   ├── [state]/[county]/page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── states/
│   │   │   │   ├── [code]/page.tsx       # State deep dive
│   │   │   │   └── page.tsx
│   │   │   ├── methodology/page.tsx
│   │   │   └── about/page.tsx
│   │   ├── (auth)/                       # Auth-required routes
│   │   │   ├── bounties/
│   │   │   │   ├── [id]/page.tsx         # Bounty detail + submit
│   │   │   │   ├── create/page.tsx       # Admin: create bounty
│   │   │   │   └── page.tsx              # Bounty board
│   │   │   ├── profile/
│   │   │   │   └── page.tsx              # User profile + history
│   │   │   └── dashboard/
│   │   │       └── page.tsx              # Admin dashboard
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── wallet/route.ts       # Verify Solana wallet signature
│   │       │   └── session/route.ts      # Session management
│   │       ├── judges/
│   │       │   ├── route.ts              # GET /api/judges?q=&state=&sort=
│   │       │   └── [slug]/route.ts       # GET /api/judges/:slug
│   │       ├── bounties/
│   │       │   ├── route.ts              # GET/POST bounties
│   │       │   ├── [id]/route.ts         # GET/PATCH bounty
│   │       │   ├── [id]/claim/route.ts   # POST claim bounty
│   │       │   └── [id]/submit/route.ts  # POST submit evidence
│   │       ├── payments/
│   │       │   ├── route.ts              # Payment status
│   │       │   └── verify/route.ts       # Verify on-chain tx
│   │       ├── search/route.ts           # Full-text search
│   │       └── pipeline/
│   │           ├── status/route.ts       # Pipeline build status
│   │           └── trigger/route.ts      # Admin: trigger rebuild
│   ├── components/
│   │   ├── ui/                           # Reusable primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Skeleton.tsx
│   │   ├── judges/
│   │   │   ├── JudgeCard.tsx
│   │   │   ├── JudgeTable.tsx
│   │   │   ├── JudgeProfile.tsx
│   │   │   ├── LeniencyBar.tsx
│   │   │   ├── ComparePanel.tsx
│   │   │   └── ScoreRing.tsx
│   │   ├── maps/
│   │   │   ├── USMap.tsx
│   │   │   ├── StateMap.tsx
│   │   │   ├── CountyHeatmap.tsx
│   │   │   └── DistrictMap.tsx
│   │   ├── bounties/
│   │   │   ├── BountyCard.tsx
│   │   │   ├── BountyBoard.tsx
│   │   │   ├── SubmissionForm.tsx
│   │   │   └── BountyStatus.tsx
│   │   ├── wallet/
│   │   │   ├── WalletProvider.tsx
│   │   │   ├── ConnectButton.tsx
│   │   │   └── WalletBalance.tsx
│   │   ├── NavBar.tsx
│   │   ├── Footer.tsx
│   │   └── SearchBar.tsx
│   ├── lib/
│   │   ├── db/
│   │   │   ├── supabase.ts              # Supabase client (server + client)
│   │   │   ├── queries.ts               # Type-safe query builders
│   │   │   └── types.ts                 # Generated DB types
│   │   ├── solana/
│   │   │   ├── client.ts                # Solana connection
│   │   │   ├── wallet-auth.ts           # SIWS (Sign-In With Solana)
│   │   │   ├── payments.ts              # USDC transfer logic
│   │   │   └── constants.ts             # Program IDs, USDC mint
│   │   ├── scoring.ts                   # Leniency score formula
│   │   └── utils.ts                     # Shared helpers
│   └── hooks/
│       ├── useWallet.ts
│       ├── useAuth.ts
│       └── useBounties.ts
├── pipeline/                             # Data pipeline (Python)
│   ├── pipeline.py
│   ├── config.yaml
│   ├── ingest/
│   ├── validate/
│   └── sync.py                          # Sync master/ → Supabase
├── data/
│   ├── raw/                             # Untouched source files
│   ├── master/                          # Pipeline output
│   └── incoming/                        # Bounty submissions
├── supabase/
│   └── migrations/                      # DB migrations
│       └── 001_initial.sql
└── docs/
```

### Database Schema

```sql
-- ============================================================
-- CORE DATA (populated by pipeline)
-- ============================================================

CREATE TABLE state_judges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  state_code TEXT NOT NULL,
  state TEXT NOT NULL,
  county TEXT NOT NULL,
  court_facility TEXT,
  total_cases INTEGER NOT NULL,
  prison_rate REAL NOT NULL,
  jail_rate REAL NOT NULL,
  probation_rate REAL NOT NULL,
  other_rate REAL NOT NULL,
  prison_count INTEGER NOT NULL,
  jail_count INTEGER NOT NULL,
  probation_count INTEGER NOT NULL,
  other_count INTEGER NOT NULL,
  leniency_score INTEGER NOT NULL,
  avg_commitment_days REAL,
  violent_total INTEGER NOT NULL DEFAULT 0,
  violent_prison_rate REAL NOT NULL DEFAULT 0,
  violent_probation_rate REAL NOT NULL DEFAULT 0,
  offense_breakdown JSONB DEFAULT '{}',
  race_breakdown JSONB DEFAULT '{}',
  gender_breakdown JSONB DEFAULT '{}',
  sentence_types JSONB DEFAULT '{}',
  data_source TEXT NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_state_judges_state ON state_judges(state_code);
CREATE INDEX idx_state_judges_leniency ON state_judges(leniency_score);
CREATE INDEX idx_state_judges_name ON state_judges USING gin(to_tsvector('english', name));

CREATE TABLE county_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  state_code TEXT NOT NULL DEFAULT 'FL',
  judicial_circuit TEXT,
  total_cases INTEGER NOT NULL,
  felony_cases INTEGER,
  misdemeanor_cases INTEGER,
  prison_rate REAL,
  jail_rate REAL,
  probation_rate REAL,
  comm_ctrl_rate REAL,
  no_confinement_rate REAL,
  withheld_rate REAL,
  felony_ratio REAL,
  data_source TEXT NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE federal_judges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cl_id INTEGER UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  gender TEXT,
  date_of_birth DATE,
  court TEXT NOT NULL,
  court_full TEXT,
  court_type TEXT,
  state TEXT,
  appointed_by TEXT,
  party TEXT,
  is_active BOOLEAN DEFAULT false,
  year_started INTEGER,
  years_serving INTEGER,
  positions JSONB DEFAULT '[]',
  accountability_score INTEGER,
  data_source TEXT NOT NULL DEFAULT 'CourtListener',
  last_updated TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_federal_judges_state ON federal_judges(state);
CREATE INDEX idx_federal_judges_party ON federal_judges(party);
CREATE INDEX idx_federal_judges_name ON federal_judges USING gin(to_tsvector('english', name));

-- ============================================================
-- USER SYSTEM
-- ============================================================

CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,     -- Solana public key
  display_name TEXT,
  avatar_url TEXT,
  reputation INTEGER DEFAULT 0,
  bounties_completed INTEGER DEFAULT 0,
  total_earned_usdc REAL DEFAULT 0,
  role TEXT DEFAULT 'hunter'               -- hunter | admin
    CHECK (role IN ('hunter', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_reputation ON users(reputation DESC);

-- ============================================================
-- BOUNTY SYSTEM
-- ============================================================

CREATE TYPE bounty_status AS ENUM (
  'open',          -- Posted, available to claim
  'claimed',       -- Someone is working on it
  'submitted',     -- Evidence submitted, awaiting review
  'in_review',     -- Admin is reviewing
  'approved',      -- Approved, payment pending
  'paid',          -- USDC sent to hunter
  'rejected',      -- Submission rejected
  'expired',       -- Time ran out
  'cancelled'      -- Admin cancelled
);

CREATE TYPE bounty_category AS ENUM (
  'sunshine_law',      -- File a public records request
  'court_scrape',      -- Scrape a court portal
  'data_collection',   -- Gather specific data
  'verification',      -- Verify existing data
  'research'           -- General research task
);

CREATE TYPE bounty_difficulty AS ENUM (
  'easy',       -- Simple data lookup
  'medium',     -- Requires filing requests
  'hard',       -- Complex multi-step
  'expert'      -- Legal knowledge required
);

CREATE TABLE bounties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category bounty_category NOT NULL,
  difficulty bounty_difficulty NOT NULL DEFAULT 'medium',
  
  -- Target
  target_state TEXT,                       -- State code (FL, IL, etc.)
  target_county TEXT,                      -- County name
  target_court TEXT,                       -- Court name/ID
  target_judge TEXT,                       -- Judge name if specific
  
  -- Reward
  reward_usdc REAL NOT NULL,               -- USDC amount
  reward_wallet TEXT,                      -- Escrow wallet holding USDC
  escrow_tx TEXT,                          -- Solana tx hash of escrow deposit
  
  -- Lifecycle
  status bounty_status DEFAULT 'open',
  created_by UUID REFERENCES users(id),
  claimed_by UUID REFERENCES users(id),
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,                  -- Claim expires if not submitted
  
  -- Requirements
  required_data_format TEXT,               -- Expected file format (CSV, JSON, PDF)
  required_fields TEXT[],                  -- Fields the data must contain
  instructions TEXT,                       -- Detailed instructions
  max_claims INTEGER DEFAULT 1,            -- How many can work on this
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bounties_status ON bounties(status);
CREATE INDEX idx_bounties_category ON bounties(category);
CREATE INDEX idx_bounties_state ON bounties(target_state);

CREATE TABLE bounty_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bounty_id UUID REFERENCES bounties(id) NOT NULL,
  submitted_by UUID REFERENCES users(id) NOT NULL,
  
  -- Evidence
  file_urls TEXT[],                        -- Supabase Storage URLs
  notes TEXT,                              -- Hunter's description of what they got
  record_count INTEGER,                    -- How many records in submission
  
  -- Validation
  validation_status TEXT DEFAULT 'pending'
    CHECK (validation_status IN ('pending', 'valid', 'invalid', 'partial')),
  validation_notes TEXT,                   -- Pipeline validation output
  pipeline_run_id TEXT,                    -- Reference to pipeline run
  
  -- Review
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Payment
  payment_tx TEXT,                         -- Solana tx hash of USDC payment
  payment_amount REAL,
  paid_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_submissions_bounty ON bounty_submissions(bounty_id);
CREATE INDEX idx_submissions_user ON bounty_submissions(submitted_by);

-- ============================================================
-- ACTIVITY & REPUTATION
-- ============================================================

CREATE TABLE reputation_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN (
      'bounty_completed', 'bounty_rejected', 'data_verified',
      'first_bounty', 'streak_bonus', 'high_quality'
    )),
  points INTEGER NOT NULL,
  bounty_id UUID REFERENCES bounties(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DATA PIPELINE TRACKING
-- ============================================================

CREATE TABLE pipeline_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'failed')),
  sources_processed JSONB DEFAULT '[]',
  records_processed INTEGER DEFAULT 0,
  judges_updated INTEGER DEFAULT 0,
  counties_updated INTEGER DEFAULT 0,
  validation_result JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  triggered_by TEXT                        -- 'cron', 'manual', 'bounty_submission'
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bounty_submissions ENABLE ROW LEVEL SECURITY;

-- Public read for bounties
CREATE POLICY "Bounties are publicly readable"
  ON bounties FOR SELECT USING (true);

-- Only admins can create bounties
CREATE POLICY "Admins can create bounties"
  ON bounties FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (id = auth.uid() OR true);  -- profiles are public

-- Users can submit to bounties they claimed
CREATE POLICY "Hunters can submit to claimed bounties"
  ON bounty_submissions FOR INSERT
  WITH CHECK (
    submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM bounties
      WHERE id = bounty_id AND claimed_by = auth.uid()
    )
  );
```

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/judges` | No | Search/filter/paginate judges |
| GET | `/api/judges/[slug]` | No | Single judge profile |
| GET | `/api/federal/[id]` | No | Federal judge profile |
| GET | `/api/counties` | No | County profiles |
| GET | `/api/search` | No | Full-text search across all entities |
| GET | `/api/stats` | No | Platform-wide statistics |
| POST | `/api/auth/wallet` | No | Verify wallet signature, create/return user |
| DELETE | `/api/auth/session` | Yes | Logout |
| GET | `/api/bounties` | No | List bounties (filterable) |
| POST | `/api/bounties` | Admin | Create bounty |
| GET | `/api/bounties/[id]` | No | Bounty detail |
| POST | `/api/bounties/[id]/claim` | Hunter | Claim a bounty |
| POST | `/api/bounties/[id]/submit` | Hunter | Submit evidence |
| PATCH | `/api/bounties/[id]` | Admin | Update status (approve/reject) |
| POST | `/api/payments/verify` | Admin | Verify Solana tx hash |
| GET | `/api/profile` | Yes | Current user profile |
| GET | `/api/leaderboard` | No | Top hunters by reputation |
| POST | `/api/pipeline/trigger` | Admin | Trigger pipeline rebuild |
| GET | `/api/pipeline/status` | Admin | Pipeline run status |

### Bounty Flow

```
Admin creates bounty:
  1. Admin connects wallet (Phantom)
  2. Creates bounty with title, description, reward amount
  3. Signs USDC transfer to escrow wallet
  4. Bounty goes live on board

Hunter claims bounty:
  1. Hunter connects wallet
  2. Browses bounty board, reads requirements
  3. Claims bounty (status: open → claimed)
  4. Has X days to submit (configurable per bounty)

Hunter submits evidence:
  1. Uploads files (CSV, PDF, screenshots)
  2. Adds notes explaining what they collected
  3. Submission auto-validated by pipeline if possible
  4. Status: claimed → submitted

Admin reviews:
  1. Reviews submission against requirements
  2. Pipeline validation results shown alongside
  3. Approves or rejects with notes
  4. If approved: triggers USDC release from escrow

Payment:
  1. USDC transferred from escrow to hunter wallet
  2. Transaction hash recorded
  3. Hunter reputation updated
  4. Data ingested into pipeline
```

### Solana Integration

```typescript
// Sign-In With Solana (SIWS)
// No email/password — wallet IS the identity

// Auth flow:
// 1. Frontend generates nonce
// 2. User signs message: "Sign in to RedHanded\nNonce: {nonce}\nTimestamp: {ts}"
// 3. Backend verifies signature against wallet pubkey
// 4. Creates/returns Supabase session

// Payment flow:
// 1. Admin funds bounty → USDC transferred to program-derived escrow
// 2. On approval → instruction to release USDC to hunter
// 3. Simple SPL token transfer — no complex program needed for MVP
// 4. For MVP: admin manually sends USDC, records tx hash
//    For v2: on-chain escrow program

// Dependencies:
// @solana/web3.js — connection, transactions
// @solana/spl-token — USDC transfers
// @solana/wallet-adapter-react — Phantom/Solflare connect
// tweetnacl — signature verification (backend)
```

### MVP Scope (Build This First)

**Phase 1 — Database + API (Foundation)**
- [ ] Supabase migration: create all tables
- [ ] Sync pipeline output → Supabase (pipeline/sync.py)
- [ ] API routes for judges, counties, search, stats
- [ ] Convert pages to read from API instead of static JSON

**Phase 2 — Wallet Auth + User Profiles**
- [ ] Solana wallet connect (Phantom/Solflare)
- [ ] Sign-In With Solana (SIWS) verification
- [ ] User profile page (wallet, reputation, history)

**Phase 3 — Bounty Board**
- [ ] Bounty CRUD (admin creates, hunters browse)
- [ ] Claim flow (hunter claims, timer starts)
- [ ] Submission flow (upload files, add notes)
- [ ] Admin review dashboard
- [ ] Pipeline validation on submissions

**Phase 4 — Payments**
- [ ] USDC payment on approval (manual send for MVP)
- [ ] Transaction verification (record tx hash)
- [ ] Leaderboard (top hunters by reputation + earnings)

**Phase 5 — Polish**
- [ ] Migrate inline styles → Tailwind
- [ ] Mobile responsive
- [ ] Error boundaries
- [ ] SEO optimization
- [ ] Rate limiting on API
