-- RedHanded Schema v2 — Expansion for offenders, districts, offense analytics
-- Run this in Supabase SQL Editor AFTER the original setup-db.sql

-- ============================================
-- DISTRICT PROFILES TABLE
-- Aggregate stats per federal district
-- ============================================
CREATE TABLE IF NOT EXISTS district_profiles (
  district_code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  circuit INTEGER,
  cl_court_id TEXT, -- CourtListener court ID
  -- Case stats
  total_cases_fy25 INTEGER DEFAULT 0,
  -- Recidivism
  recidivism_rate NUMERIC(5,2),
  repeat_offenders INTEGER DEFAULT 0,
  high_risk_offenders INTEGER DEFAULT 0, -- Criminal History Cat IV-VI
  avg_criminal_history_points NUMERIC(5,2),
  -- Sentencing
  avg_sentence_months NUMERIC(7,2),
  median_sentence_months NUMERIC(7,2),
  below_guideline_rate NUMERIC(5,2),
  above_guideline_rate NUMERIC(5,2),
  -- Offense breakdown (JSONB)
  offense_breakdown JSONB DEFAULT '{}',
  -- Demographics (JSONB)
  demographics JSONB DEFAULT '{}',
  -- Criminal history distribution
  criminal_history_distribution JSONB DEFAULT '{}',
  -- Metadata
  data_source TEXT DEFAULT 'USSC FY2025',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OFFENDERS TABLE
-- Individual criminal profiles from public records
-- ============================================
CREATE TABLE IF NOT EXISTS offenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identity (from public court records)
  name TEXT,
  cl_party_id INTEGER, -- CourtListener party ID if available
  -- Demographics
  gender TEXT,
  race TEXT,
  age_at_sentencing INTEGER,
  education_level TEXT,
  citizenship TEXT,
  -- Criminal history
  criminal_history_category INTEGER, -- 1-6
  criminal_history_points INTEGER,
  total_prior_offenses INTEGER DEFAULT 0,
  prior_violent_offenses INTEGER DEFAULT 0,
  -- Current case
  district_code TEXT,
  offense_type TEXT,
  offense_detail TEXT,
  sentence_months NUMERIC(7,2),
  fine_amount NUMERIC(12,2),
  restitution_amount NUMERIC(12,2),
  probation_months NUMERIC(7,2),
  -- Guideline comparison
  guideline_min INTEGER,
  guideline_max INTEGER,
  statutory_min INTEGER,
  statutory_max INTEGER,
  departure_type TEXT, -- 'below', 'within', 'above'
  -- Connections
  judge_id TEXT REFERENCES judges(id) ON DELETE SET NULL,
  docket_ids TEXT[] DEFAULT '{}',
  -- Risk assessment
  is_violent_offender BOOLEAN DEFAULT false,
  is_repeat_offender BOOLEAN DEFAULT false,
  times_convicted INTEGER DEFAULT 1,
  -- Source tracking
  source TEXT DEFAULT 'USSC',
  ussc_id TEXT,
  fiscal_year INTEGER,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OFFENDER CASES TABLE
-- Links offenders to their case history
-- ============================================
CREATE TABLE IF NOT EXISTS offender_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offender_id UUID REFERENCES offenders(id) ON DELETE CASCADE,
  -- Case details
  docket_id TEXT,
  cl_docket_id INTEGER,
  case_name TEXT,
  case_number TEXT,
  -- Court info
  district_code TEXT,
  court_name TEXT,
  judge_id TEXT REFERENCES judges(id) ON DELETE SET NULL,
  judge_name TEXT,
  -- Dates
  date_filed DATE,
  date_sentenced DATE,
  date_terminated DATE,
  -- Offense
  offense_type TEXT,
  offense_description TEXT,
  -- Sentence
  sentence_months NUMERIC(7,2),
  sentence_type TEXT, -- prison, probation, split, time-served
  -- Outcome
  was_released BOOLEAN DEFAULT false,
  reoffended_after BOOLEAN DEFAULT false,
  -- Metadata
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OFFENSE CATEGORIES TABLE
-- Standardized offense type reference
-- ============================================
CREATE TABLE IF NOT EXISTS offense_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_violent BOOLEAN DEFAULT false,
  severity_level INTEGER DEFAULT 1, -- 1-5
  icon TEXT, -- emoji for UI
  color TEXT -- hex color for charts
);

-- Seed offense categories
INSERT INTO offense_categories (id, name, is_violent, severity_level, icon, color) VALUES
  ('drug_trafficking', 'Drug Trafficking', false, 3, '💊', '#ef4444'),
  ('drug_possession', 'Drug Possession', false, 1, '💊', '#f97316'),
  ('fraud', 'Fraud/White Collar', false, 2, '💰', '#eab308'),
  ('weapons', 'Weapons Offenses', true, 4, '🔫', '#dc2626'),
  ('immigration', 'Immigration', false, 1, '🌐', '#3b82f6'),
  ('sex_offense', 'Sex Offenses', true, 5, '⚠️', '#7c2d12'),
  ('child_exploitation', 'Child Exploitation', true, 5, '🚨', '#991b1b'),
  ('assault', 'Assault/Violence', true, 4, '👊', '#b91c1c'),
  ('robbery', 'Robbery', true, 4, '🏴', '#9f1239'),
  ('murder', 'Murder/Manslaughter', true, 5, '💀', '#450a0a'),
  ('theft', 'Theft/Larceny', false, 2, '🏷️', '#d97706'),
  ('money_laundering', 'Money Laundering', false, 3, '🏦', '#a16207'),
  ('racketeering', 'Racketeering/RICO', true, 4, '🕵️', '#78350f'),
  ('terrorism', 'Terrorism', true, 5, '🔴', '#7f1d1d'),
  ('cybercrime', 'Cybercrime', false, 3, '💻', '#6366f1'),
  ('environmental', 'Environmental Crime', false, 2, '🌿', '#16a34a'),
  ('tax', 'Tax Evasion', false, 2, '📊', '#ca8a04'),
  ('other', 'Other', false, 1, '📋', '#6b7280')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_district_state ON district_profiles(state);
CREATE INDEX IF NOT EXISTS idx_offenders_district ON offenders(district_code);
CREATE INDEX IF NOT EXISTS idx_offenders_judge ON offenders(judge_id);
CREATE INDEX IF NOT EXISTS idx_offenders_crimhist ON offenders(criminal_history_category);
CREATE INDEX IF NOT EXISTS idx_offenders_offense ON offenders(offense_type);
CREATE INDEX IF NOT EXISTS idx_offenders_repeat ON offenders(is_repeat_offender) WHERE is_repeat_offender = true;
CREATE INDEX IF NOT EXISTS idx_offenders_violent ON offenders(is_violent_offender) WHERE is_violent_offender = true;
CREATE INDEX IF NOT EXISTS idx_offender_cases_offender ON offender_cases(offender_id);
CREATE INDEX IF NOT EXISTS idx_offender_cases_judge ON offender_cases(judge_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE district_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE offenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE offender_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE offense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read districts" ON district_profiles FOR SELECT USING (true);
CREATE POLICY "Public read offenders" ON offenders FOR SELECT USING (true);
CREATE POLICY "Public read offender_cases" ON offender_cases FOR SELECT USING (true);
CREATE POLICY "Public read offense_categories" ON offense_categories FOR SELECT USING (true);

-- ============================================
-- Add new columns to judges table
-- ============================================
ALTER TABLE judges ADD COLUMN IF NOT EXISTS violent_case_pct NUMERIC(5,2);
ALTER TABLE judges ADD COLUMN IF NOT EXISTS avg_sentence_months NUMERIC(7,2);
ALTER TABLE judges ADD COLUMN IF NOT EXISTS below_guideline_pct NUMERIC(5,2);
ALTER TABLE judges ADD COLUMN IF NOT EXISTS repeat_offenders_handled INTEGER DEFAULT 0;
ALTER TABLE judges ADD COLUMN IF NOT EXISTS district_code TEXT;
