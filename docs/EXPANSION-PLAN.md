# RedHanded — Full Expansion Plan

## Vision
A comprehensive public accountability & safety platform for the federal justice system.
Not just judges — criminals, patterns, rehabilitation effectiveness, and geographic analysis.

## New Data Layers

### 1. Individual Offender Profiles
- Source: CourtListener dockets + PACER data
- Shows: Name, charges, case history, judge assignments, sentences
- Key feature: Repeat offenders with 10+ prior offenses highlighted
- Privacy: Only public court records (all already public)

### 2. Judge-Offender Connections
- Which judges have released the most repeat offenders?
- Which judges' released defendants went on to reoffend?
- Pattern analysis: Is a judge consistently lenient with violent offenders?

### 3. District/Geographic Analysis
- Interactive US map with heat map overlay
- Metrics per district: recidivism rate, avg sentence, offense breakdown
- Compare districts side-by-side
- "Worst districts" rankings

### 4. Offense Type Analytics
- Drug trafficking, weapons, fraud, sex offenses, immigration, etc.
- Which districts see which types of crime?
- Sentencing disparities by offense type

### 5. Rehabilitation Effectiveness
- Recidivism rate as proxy for rehabilitation failure
- Criminal history escalation (Category I → VI over time)
- Districts with best/worst outcomes
- Below-guidelines sentencing vs. recidivism correlation

## New Pages

### /criminals (Offender Database)
- Searchable list of federal offenders from public records
- Filters: offense type, district, criminal history, sentence length
- Sort by: most offenses, longest history, most recent

### /criminal/[id] (Offender Profile)
- Full case history timeline
- Judges who handled each case
- Criminal history progression
- Sentence details per case

### /districts (Geographic Analysis)
- Full-page interactive US map
- Color-coded by: recidivism, sentence severity, offense types
- Click through to district detail

### /district/[id] (District Deep Dive)
- All judges in this district
- Offense breakdown pie chart
- Sentencing patterns over time
- Top repeat offenders in this district
- Comparison to national averages

### /rankings (Accountability Rankings)
- Worst judges by accountability score
- Worst districts by recidivism
- Most lenient vs. strictest sentencing
- Highest repeat offender concentrations

### Enhanced /judge/[id] (Judge Profile)
- Add: offense type breakdown for their cases
- Add: repeat offenders they've handled
- Add: their sentencing vs. guidelines comparison
- Add: district comparison context

## Database Schema Additions

### offenders table
- id, name, docket_ids[], district, 
- total_prior_offenses, criminal_history_category
- offense_types[], most_recent_offense
- total_sentences_months, times_released
- judge_ids[] (all judges who handled their cases)

### offense_stats table (district-level aggregates)  
- district_code, offense_type, count, avg_sentence
- below_guideline_rate, fiscal_year

### district_profiles table
- district_code, name, state, circuit
- total_cases, recidivism_rate
- avg_sentence, below_guideline_rate
- offense_breakdown (JSONB)
- criminal_history_distribution (JSONB)
- demographics (JSONB)

## Data Pipeline

### Phase 1: USSC Aggregate Data (NOW - no API needed)
- ✅ District recidivism rates 
- 🔄 Offense breakdowns per district
- 🔄 Criminal history severity data
- 🔄 Sentencing pattern analysis

### Phase 2: CourtListener Case Data (API - rate limited)
- 🔄 106/190 judge case counts done
- Next: Pull actual docket details for high-profile cases
- Match defendants across dockets for repeat offender tracking

### Phase 3: Enhanced Scoring
- Factor in offense-type-adjusted recidivism
- Weight by violent vs. non-violent offenses
- Compare judge's sentencing to district averages

### Phase 4: Public Records Integration
- BOP (Bureau of Prisons) inmate search
- Sex offender registries (state-level)
- PACER for detailed case documents
