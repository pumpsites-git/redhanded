-- RedHanded Phase 1: Initial Schema
-- State judges (IL Cook County + FL counties)
CREATE TABLE IF NOT EXISTS state_judges (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  state_code CHAR(2) NOT NULL,
  county TEXT NOT NULL,
  court_facility TEXT,
  total_cases INTEGER NOT NULL DEFAULT 0,
  prison_rate FLOAT NOT NULL DEFAULT 0,
  jail_rate FLOAT NOT NULL DEFAULT 0,
  probation_rate FLOAT NOT NULL DEFAULT 0,
  other_rate FLOAT NOT NULL DEFAULT 0,
  prison_count INTEGER NOT NULL DEFAULT 0,
  jail_count INTEGER NOT NULL DEFAULT 0,
  probation_count INTEGER NOT NULL DEFAULT 0,
  other_count INTEGER NOT NULL DEFAULT 0,
  avg_commitment_days FLOAT,
  leniency_score INTEGER NOT NULL DEFAULT 0,
  violent_cases JSONB NOT NULL DEFAULT '{}',
  sentence_types JSONB NOT NULL DEFAULT '{}',
  offense_breakdown JSONB NOT NULL DEFAULT '{}',
  race_breakdown JSONB NOT NULL DEFAULT '{}',
  gender_breakdown JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_state_judges_state_code ON state_judges(state_code);
CREATE INDEX IF NOT EXISTS idx_state_judges_leniency_score ON state_judges(leniency_score DESC);
CREATE INDEX IF NOT EXISTS idx_state_judges_total_cases ON state_judges(total_cases DESC);
CREATE INDEX IF NOT EXISTS idx_state_judges_name_trgm ON state_judges USING gin(to_tsvector('english', name));

-- FL county profiles
CREATE TABLE IF NOT EXISTS county_profiles (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  state_name TEXT NOT NULL,
  judicial_circuit TEXT,
  total_cases INTEGER NOT NULL DEFAULT 0,
  felony_cases INTEGER NOT NULL DEFAULT 0,
  misdemeanor_cases INTEGER NOT NULL DEFAULT 0,
  felony_ratio FLOAT NOT NULL DEFAULT 0,
  prison_rate FLOAT NOT NULL DEFAULT 0,
  jail_rate FLOAT NOT NULL DEFAULT 0,
  probation_rate FLOAT NOT NULL DEFAULT 0,
  comm_ctrl_rate FLOAT NOT NULL DEFAULT 0,
  no_confinement_rate FLOAT NOT NULL DEFAULT 0,
  withheld_adjudication_rate FLOAT NOT NULL DEFAULT 0,
  avg_felony_sentence_days FLOAT,
  avg_misd_sentence_days FLOAT,
  leniency_score INTEGER NOT NULL DEFAULT 0,
  leniency_rank INTEGER,
  violent_cases JSONB NOT NULL DEFAULT '{}',
  race_breakdown JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_county_profiles_state ON county_profiles(state);
CREATE INDEX IF NOT EXISTS idx_county_profiles_leniency ON county_profiles(leniency_score DESC);
CREATE INDEX IF NOT EXISTS idx_county_profiles_name_fts ON county_profiles USING gin(to_tsvector('english', name));

-- Federal judges (from CourtListener)
CREATE TABLE IF NOT EXISTS federal_judges (
  id BIGSERIAL PRIMARY KEY,
  cl_id TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  gender TEXT,
  race TEXT[],
  court TEXT NOT NULL,
  court_full TEXT,
  court_id TEXT,
  court_type TEXT,
  jurisdiction TEXT,
  state TEXT,
  status TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  appointed_by TEXT,
  party TEXT,
  year_started INTEGER,
  years_serving INTEGER NOT NULL DEFAULT 0,
  education TEXT,
  aba_rating TEXT,
  confirmation_votes_yes INTEGER,
  confirmation_votes_no INTEGER,
  has_photo BOOLEAN NOT NULL DEFAULT false,
  photo_url TEXT,
  accountability_score FLOAT,
  positions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_federal_judges_state ON federal_judges(state);
CREATE INDEX IF NOT EXISTS idx_federal_judges_party ON federal_judges(party);
CREATE INDEX IF NOT EXISTS idx_federal_judges_is_active ON federal_judges(is_active);
CREATE INDEX IF NOT EXISTS idx_federal_judges_years_serving ON federal_judges(years_serving DESC);
CREATE INDEX IF NOT EXISTS idx_federal_judges_name_fts ON federal_judges USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_federal_judges_court_fts ON federal_judges USING gin(to_tsvector('english', coalesce(court_full, court)));
