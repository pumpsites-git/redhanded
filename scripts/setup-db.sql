-- RedHanded Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- JUDGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS judges (
  id TEXT PRIMARY KEY,
  cl_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT,
  gender TEXT,
  court TEXT NOT NULL,
  court_full TEXT,
  court_id TEXT,
  court_type TEXT DEFAULT 'federal_district',
  jurisdiction TEXT,
  state TEXT NOT NULL,
  appointed_by TEXT,
  party TEXT,
  year_started INTEGER,
  years_serving INTEGER DEFAULT 0,
  education TEXT,
  aba_rating TEXT,
  is_active BOOLEAN DEFAULT true,
  confirmation_votes_yes INTEGER,
  confirmation_votes_no INTEGER,
  race TEXT[] DEFAULT '{}',
  has_photo BOOLEAN DEFAULT false,
  photo_url TEXT,
  -- Scoring fields
  accountability_score INTEGER,
  score_updated_at TIMESTAMPTZ,
  total_cases INTEGER,
  reversal_rate NUMERIC(5,2),
  avg_sentence_vs_guideline NUMERIC(5,2),
  bail_denial_rate NUMERIC(5,2),
  recidivism_rate NUMERIC(5,2),
  caseload_per_year INTEGER,
  citation_count INTEGER,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMUNITY REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id TEXT REFERENCES judges(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  role TEXT CHECK (role IN ('attorney', 'defendant', 'victim', 'juror', 'observer', 'other')),
  would_reelect BOOLEAN,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  author_name TEXT,
  author_email TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CASE STATS TABLE (per-judge case data from CourtListener)
-- ============================================
CREATE TABLE IF NOT EXISTS case_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id TEXT REFERENCES judges(id) ON DELETE CASCADE,
  cl_docket_id INTEGER,
  case_name TEXT,
  date_filed DATE,
  date_terminated DATE,
  nature_of_suit TEXT,
  court_id TEXT,
  -- For tracking what data we've pulled
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ELECTION INFO TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id TEXT REFERENCES judges(id) ON DELETE CASCADE,
  election_date DATE,
  election_type TEXT, -- retention, general, primary
  jurisdiction TEXT,
  result TEXT, -- won, lost, pending
  vote_yes INTEGER,
  vote_no INTEGER,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DATA COLLECTION LOG (track API fetching progress)
-- ============================================
CREATE TABLE IF NOT EXISTS data_collection_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id TEXT REFERENCES judges(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL, -- 'cases', 'opinions', 'citations', 'sentencing'
  status TEXT DEFAULT 'pending', -- pending, in_progress, complete, error
  records_fetched INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_judges_state ON judges(state);
CREATE INDEX IF NOT EXISTS idx_judges_party ON judges(party);
CREATE INDEX IF NOT EXISTS idx_judges_court_type ON judges(court_type);
CREATE INDEX IF NOT EXISTS idx_judges_score ON judges(accountability_score);
CREATE INDEX IF NOT EXISTS idx_judges_cl_id ON judges(cl_id);
CREATE INDEX IF NOT EXISTS idx_reviews_judge ON reviews(judge_id);
CREATE INDEX IF NOT EXISTS idx_case_stats_judge ON case_stats(judge_id);
CREATE INDEX IF NOT EXISTS idx_elections_judge ON elections(judge_id);
CREATE INDEX IF NOT EXISTS idx_data_log_judge ON data_collection_log(judge_id);

-- ============================================
-- FULL TEXT SEARCH
-- ============================================
ALTER TABLE judges ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(court, '') || ' ' || coalesce(court_full, '') || ' ' || coalesce(state, '') || ' ' || coalesce(education, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_judges_fts ON judges USING gin(fts);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read judges" ON judges FOR SELECT USING (true);
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Public read elections" ON elections FOR SELECT USING (true);

-- Anyone can submit a review (moderated)
CREATE POLICY "Anyone can submit reviews" ON reviews FOR INSERT WITH CHECK (true);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER judges_updated_at
  BEFORE UPDATE ON judges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
