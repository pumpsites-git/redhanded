-- RedHanded Phase 2: Bounty System
-- ─────────────────────────────────────────────────────────────────────────────

-- ── bounties table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bounties (
  id                 TEXT PRIMARY KEY,                   -- e.g. 'fl-miami-dade'
  state              TEXT NOT NULL,                      -- 'Florida'
  state_code         CHAR(2) NOT NULL,                   -- 'FL'
  county             TEXT NOT NULL,                      -- 'Miami-Dade'
  population         INTEGER NOT NULL DEFAULT 0,
  estimated_cases    INTEGER NOT NULL DEFAULT 0,
  bounty_amount_cents INTEGER NOT NULL DEFAULT 2500,     -- $25 minimum
  tier               SMALLINT NOT NULL CHECK (tier IN (1, 2, 3)),
  status             TEXT NOT NULL DEFAULT 'open'
                       CHECK (status IN ('open','claimed','submitted','verified','paid')),
  claimed_by_email   TEXT,
  claimed_at         TIMESTAMPTZ,
  submitted_at       TIMESTAMPTZ,
  verified_at        TIMESTAMPTZ,
  file_url           TEXT,
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── contributions table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contributions (
  id                 BIGSERIAL PRIMARY KEY,
  bounty_id          TEXT REFERENCES bounties(id) ON DELETE SET NULL,
  state              TEXT NOT NULL,
  county             TEXT NOT NULL,
  contributor_email  TEXT NOT NULL,
  file_url           TEXT,
  file_type          TEXT,                               -- 'csv', 'xlsx', 'pdf'
  notes              TEXT,
  status             TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','reviewing','accepted','rejected')),
  reviewed_at        TIMESTAMPTZ,
  reviewer_notes     TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS bounties_state_code_idx ON bounties(state_code);
CREATE INDEX IF NOT EXISTS bounties_status_idx ON bounties(status);
CREATE INDEX IF NOT EXISTS bounties_tier_idx ON bounties(tier);
CREATE INDEX IF NOT EXISTS contributions_bounty_id_idx ON contributions(bounty_id);
CREATE INDEX IF NOT EXISTS contributions_status_idx ON contributions(status);
CREATE INDEX IF NOT EXISTS contributions_contributor_email_idx ON contributions(contributor_email);

-- ── updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bounties_updated_at
  BEFORE UPDATE ON bounties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Seed data: Florida Tier 1 ────────────────────────────────────────────────
INSERT INTO bounties (id, state, state_code, county, population, estimated_cases, bounty_amount_cents, tier, status, notes)
VALUES
  ('fl-miami-dade',   'Florida', 'FL', 'Miami-Dade',   2700000, 85000, 10000, 1, 'open', 'Online portal at miamidadeclerk.gov/clerk/public-records-requests.page'),
  ('fl-broward',      'Florida', 'FL', 'Broward',      1900000, 60000, 10000, 1, 'open', 'Also has paid API at browardclerk.org'),
  ('fl-palm-beach',   'Florida', 'FL', 'Palm Beach',   1500000, 48000, 10000, 1, 'open', NULL),
  ('fl-hillsborough', 'Florida', 'FL', 'Hillsborough', 1500000, 50000, 10000, 1, 'open', 'FOIA portal at hillsclerk.justfoia.com'),
  ('fl-orange',       'Florida', 'FL', 'Orange',       1400000, 44000, 10000, 1, 'open', 'myorangeclerk.com'),
  ('fl-pinellas',     'Florida', 'FL', 'Pinellas',     1000000, 32000,  7500, 1, 'open', NULL),
  ('fl-duval',        'Florida', 'FL', 'Duval',        1000000, 35000,  7500, 1, 'open', 'CORE system searchable; 501 W Adams St, Jacksonville FL 32202'),
  ('fl-lee',          'Florida', 'FL', 'Lee',           770000, 24000,  7500, 1, 'open', NULL),
  ('fl-polk',         'Florida', 'FL', 'Polk',          725000, 23000,  7500, 1, 'open', NULL),
  ('fl-brevard',      'Florida', 'FL', 'Brevard',       600000, 19000,  7500, 1, 'open', NULL)
ON CONFLICT (id) DO NOTHING;

-- ── Seed data: Florida Tier 2 ────────────────────────────────────────────────
INSERT INTO bounties (id, state, state_code, county, population, estimated_cases, bounty_amount_cents, tier, status)
VALUES
  ('fl-volusia',   'Florida', 'FL', 'Volusia',   553000, 17000, 5000, 2, 'open'),
  ('fl-seminole',  'Florida', 'FL', 'Seminole',  471000, 14500, 5000, 2, 'open'),
  ('fl-sarasota',  'Florida', 'FL', 'Sarasota',  434000, 13000, 5000, 2, 'open'),
  ('fl-manatee',   'Florida', 'FL', 'Manatee',   403000, 12000, 5000, 2, 'open'),
  ('fl-collier',   'Florida', 'FL', 'Collier',   393000, 11000, 5000, 2, 'open'),
  ('fl-osceola',   'Florida', 'FL', 'Osceola',   388000, 12000, 5000, 2, 'open'),
  ('fl-lake',      'Florida', 'FL', 'Lake',      383000, 11500, 5000, 2, 'open'),
  ('fl-marion',    'Florida', 'FL', 'Marion',    382000, 12000, 5000, 2, 'open'),
  ('fl-escambia',  'Florida', 'FL', 'Escambia',  321000, 10500, 5000, 2, 'open'),
  ('fl-alachua',   'Florida', 'FL', 'Alachua',   280000,  9000, 5000, 2, 'open')
ON CONFLICT (id) DO NOTHING;

-- ── Seed data: Major US Counties — Tier 1 ───────────────────────────────────
INSERT INTO bounties (id, state, state_code, county, population, estimated_cases, bounty_amount_cents, tier, status)
VALUES
  ('il-cook',        'Illinois',       'IL', 'Cook',             5100000, 165000, 10000, 1, 'open'),
  ('ca-los-angeles', 'California',     'CA', 'Los Angeles',     10000000, 280000, 10000, 1, 'open'),
  ('tx-harris',      'Texas',          'TX', 'Harris',           4700000, 160000, 10000, 1, 'open'),
  ('az-maricopa',    'Arizona',        'AZ', 'Maricopa',         4500000, 145000, 10000, 1, 'open'),
  ('ca-san-diego',   'California',     'CA', 'San Diego',        3300000,  90000, 10000, 1, 'open'),
  ('tx-dallas',      'Texas',          'TX', 'Dallas',           2600000,  95000, 10000, 1, 'open'),
  ('ny-kings',       'New York',       'NY', 'Kings (Brooklyn)', 2500000,  70000, 10000, 1, 'open'),
  ('tx-tarrant',     'Texas',          'TX', 'Tarrant',          2100000,  72000, 10000, 1, 'open'),
  ('wa-king',        'Washington',     'WA', 'King',             2200000,  65000, 10000, 1, 'open'),
  ('ga-fulton',      'Georgia',        'GA', 'Fulton',           1100000,  42000,  7500, 1, 'open')
ON CONFLICT (id) DO NOTHING;

-- ── Seed data: US Tier 2 ─────────────────────────────────────────────────────
INSERT INTO bounties (id, state, state_code, county, population, estimated_cases, bounty_amount_cents, tier, status)
VALUES
  ('oh-cuyahoga',      'Ohio',           'OH', 'Cuyahoga',       1200000, 40000, 5000, 2, 'open'),
  ('pa-philadelphia',  'Pennsylvania',   'PA', 'Philadelphia',   1500000, 55000, 5000, 2, 'open'),
  ('nc-mecklenburg',   'North Carolina', 'NC', 'Mecklenburg',    1100000, 38000, 5000, 2, 'open'),
  ('mi-wayne',         'Michigan',       'MI', 'Wayne',          1700000, 62000, 5000, 2, 'open'),
  ('tn-shelby',        'Tennessee',      'TN', 'Shelby',          930000, 35000, 5000, 2, 'open')
ON CONFLICT (id) DO NOTHING;

-- ── Row Level Security (RLS) ─────────────────────────────────────────────────
-- Public can read bounties; only service role can write
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Read-only for anonymous/authenticated users
CREATE POLICY "bounties_public_read"
  ON bounties FOR SELECT USING (true);

-- Contributions: insert allowed for authenticated/anonymous, read only own rows
CREATE POLICY "contributions_insert_anon"
  ON contributions FOR INSERT WITH CHECK (true);

CREATE POLICY "contributions_read_own"
  ON contributions FOR SELECT
  USING (contributor_email = current_setting('app.current_user_email', true));

-- Service role bypass (used by backend/admin)
-- (Service key bypasses RLS by default in Supabase)
