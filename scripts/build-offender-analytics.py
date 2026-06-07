#!/usr/bin/env python3
"""
Build offender-analytics-fy25.json from USSC FY2025 case data.
Source: U.S. Sentencing Commission, FY2025 Annual Datafile
"""

import csv
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

CSV_PATH = "/tmp/ussc-extract.csv"
OUT_PATH = Path(__file__).parent.parent / "data/ussc/offender-analytics-fy25.json"

# ─── Codebook Mappings ─────────────────────────────────────────────────────

# OFFGUIDE numeric → label (based on USSC guideline section frequency/sentence analysis)
OFFGUIDE_MAP = {
    "1":  "Assault/Homicide",      # §2A - ~559 cases, avg 17mo
    "2":  "Assault",               # §2A variant
    "3":  "Violent Crime",         # §2A variant
    "4":  "Drug Trafficking",      # §2D variant - 854 cases, avg 82mo
    "5":  "Bribery/Corruption",    # §2C - 310 cases
    "6":  "Fraud",                 # §2B variant
    "7":  "Extortion/Racketeering",# §2E - 1432 cases, avg 122mo
    "8":  "Immigration",           # §2L variant
    "9":  "Minor Offense",         # misc
    "10": "Drug Trafficking",      # §2D - 16,222 cases, avg 90mo ← LARGEST drug
    "11": "Civil Rights",          # §2H - 150 cases
    "12": "Violent Crime",         # §2A variant with firearms
    "13": "Sex Offense",           # §2G - 8,041 cases, avg 54mo
    "14": "Fraud",                 # §2B variant
    "15": "Immigration",           # §2L variant
    "16": "Fraud/Theft",           # §2B - 5,080 cases, avg 29mo (likely wire/bank fraud)
    "17": "Immigration",           # §2L - 25,119 cases, avg 10mo ← LARGEST immigration
    "18": "Drug Trafficking",      # §2D variant
    "19": "Terrorism/Nat. Security",# §2M - 146 cases, avg 191mo
    "20": "Drug Trafficking",      # §2D variant
    "21": "Money Laundering",      # §2S - 1,368 cases, avg 68mo
    "22": "Murder/Manslaughter",   # §2A - 405 cases, avg 299mo ← very long sentences
    "23": "Obstruction/Perjury",   # §2J - 499 cases, avg 16mo
    "24": "Fraud",                 # §2B variant
    "25": "Tax Offense",           # §2T - 414 cases, avg 13mo
    "26": "Weapons/Firearms",      # §2K - 1,249 cases, 40.6% firearm enhancement
    "27": "Child Exploitation",    # §2G2 - 1,409 cases, avg 249mo ← CSAM/child trafficking
    "28": "Fraud",                 # §2B variant
    "29": "Civil Rights/Other",    # §2H variant
    "30": "Immigration (Other)",   # §2L - 1,665 cases, avg 2.6mo (very short)
}

OFFGUIDE_SECTION = {
    "1": "§2A", "2": "§2A", "3": "§2A", "12": "§2A", "22": "§2A",
    "4": "§2D", "10": "§2D", "18": "§2D", "20": "§2D",
    "5": "§2C",
    "6": "§2B", "14": "§2B", "16": "§2B", "24": "§2B", "28": "§2B",
    "7": "§2E",
    "8": "§2L", "15": "§2L", "17": "§2L", "30": "§2L",
    "9": "§2P",
    "11": "§2H", "29": "§2H",
    "13": "§2G",
    "19": "§2M",
    "21": "§2S",
    "23": "§2J",
    "25": "§2T",
    "26": "§2K",
    "27": "§2G",
}

# Race codes
RACE_MAP = {
    "1": "White",
    "2": "Black",
    "3": "Hispanic",
    "6": "Other",
    "": "Unknown",
}

# Gender codes
SEX_MAP = {
    "0": "Male",
    "1": "Female",
    "": "Unknown",
}

# Citizenship codes
CITIZEN_MAP = {
    "1": "US Citizen",
    "2": "Legal Resident",
    "3": "Illegal Alien",
    "4": "Other Alien",
    "5": "Unknown Alien",
    "": "Unknown",
}

# Education codes (USSC EDUCATN)
def educatn_label(code):
    c = code.strip()
    if not c:
        return "Unknown"
    n = int(c)
    if n == 0:
        return "Unknown"
    if 1 <= n <= 8:
        return "Less than HS"
    if n in (9, 10, 11, 12):
        return "Some High School"
    if n in (13, 14, 15, 16):
        return "HS Diploma/GED"
    if n in (21, 22):
        return "HS Diploma/GED"
    if n in (23, 24):
        return "Some College"
    if n in (31,):
        return "Associate's Degree"
    if n in (32, 33):
        return "Bachelor's Degree"
    if n in (34, 35, 36, 37):
        return "Graduate Degree"
    return "Other"

# Criminal history category
def crimhist_cat(xcrhissr):
    v = xcrhissr.strip()
    if not v:
        return None
    try:
        n = int(v)
        if 1 <= n <= 6:
            return n
    except:
        pass
    return None

# Sentencing position vs guidelines
def sent_position(row):
    """Returns 'below', 'within', or 'above' relative to guideline range."""
    try:
        senttot = float(row["SENTTOT"]) if row["SENTTOT"].strip() else None
        glmin = float(row["GLMIN"]) if row["GLMIN"].strip() else None
        glmax = float(row["GLMAX"]) if row["GLMAX"].strip() else None
        sentimp = row["SENTIMP"].strip()
        if senttot is None:
            return None
        # No prison sentence (probation etc.)
        if sentimp in ("0", "4"):
            if glmin is not None and glmin > 0:
                return "below"
            return "within"
        if glmin is None or glmax is None:
            return None
        if senttot < glmin - 0.01:
            return "below"
        elif senttot > glmax + 0.01:
            return "above"
        else:
            return "within"
    except:
        return None

# ─── Load Data ─────────────────────────────────────────────────────────────

print(f"Loading {CSV_PATH}...")
with open(CSV_PATH, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Loaded {len(rows):,} rows")

# ─── Summary Stats ─────────────────────────────────────────────────────────

ages = []
sentences = []
for r in rows:
    if r["AGE"].strip():
        try:
            ages.append(int(r["AGE"]))
        except:
            pass
    if r["SENTTOT"].strip():
        try:
            sentences.append(float(r["SENTTOT"]))
        except:
            pass

avg_age = sum(ages) / len(ages) if ages else 0
avg_sentence = sum(sentences) / len(sentences) if sentences else 0

# Gender breakdown
sex_counter = Counter(SEX_MAP.get(r["MONSEX"], "Unknown") for r in rows)
total_sex_known = sum(v for k, v in sex_counter.items() if k != "Unknown")
gender_breakdown = {
    k: round(v / len(rows) * 100, 1)
    for k, v in sex_counter.items() if k != "Unknown"
}

# Race breakdown
race_counter = Counter(RACE_MAP.get(r["NEWRACE"], "Unknown") for r in rows)
total_race_known = sum(v for k, v in race_counter.items() if k != "Unknown")
race_breakdown = {
    k: round(v / len(rows) * 100, 1)
    for k, v in race_counter.items() if k != "Unknown"
}

# Education breakdown
edu_counter = Counter(educatn_label(r["EDUCATN"]) for r in rows)
education_breakdown = {
    k: round(v / len(rows) * 100, 1)
    for k, v in sorted(edu_counter.items(), key=lambda x: -x[1])
    if k != "Unknown"
}

# Citizenship breakdown
cit_counter = Counter(CITIZEN_MAP.get(r["CITIZEN"], "Unknown") for r in rows)
citizenship_breakdown = {
    k: round(v / len(rows) * 100, 1)
    for k, v in sorted(cit_counter.items(), key=lambda x: -x[1])
    if k != "Unknown"
}

# ─── Criminal History Analysis ─────────────────────────────────────────────

cat_counts = Counter()
cat_sentences = defaultdict(list)
cat_ages = defaultdict(list)
cat_offenses = defaultdict(Counter)

for r in rows:
    cat = crimhist_cat(r["XCRHISSR"])
    if cat is None:
        continue
    cat_counts[cat] += 1
    if r["SENTTOT"].strip():
        try:
            cat_sentences[cat].append(float(r["SENTTOT"]))
        except:
            pass
    if r["AGE"].strip():
        try:
            cat_ages[cat].append(int(r["AGE"]))
        except:
            pass
    og = r["OFFGUIDE"].strip()
    if og:
        label = OFFGUIDE_MAP.get(og, f"Other (§{og})")
        cat_offenses[cat][label] += 1

category_distribution = {str(k): cat_counts[k] for k in sorted(cat_counts.keys())}
avg_sentence_by_category = {
    str(k): round(sum(v) / len(v), 1) if v else 0
    for k, v in sorted(cat_sentences.items())
}
avg_age_by_category = {
    str(k): round(sum(v) / len(v), 1) if v else 0
    for k, v in sorted(cat_ages.items())
}
offense_type_by_category = {
    str(k): {og: cnt for og, cnt in counter.most_common(8)}
    for k, counter in sorted(cat_offenses.items())
}

# ─── Worst Offenders ───────────────────────────────────────────────────────

def row_to_case(r):
    """Summarize a row for the worst-offenders lists."""
    return {
        "id": r["USSCIDN"],
        "district": r["DISTRICT"],
        "criminalHistoryCategory": crimhist_cat(r["XCRHISSR"]),
        "totalCriminalHistoryPoints": int(r["TOTCHPTS"]) if r["TOTCHPTS"].strip() else 0,
        "sentenceMonths": float(r["SENTTOT"]) if r["SENTTOT"].strip() else 0,
        "offenseGuideline": OFFGUIDE_MAP.get(r["OFFGUIDE"], "Other"),
        "age": int(r["AGE"]) if r["AGE"].strip() else None,
        "race": RACE_MAP.get(r["NEWRACE"], "Unknown"),
        "gender": SEX_MAP.get(r["MONSEX"], "Unknown"),
        "firesarmEnhancement": r["IS924C"] == "1",
    }

# Top 100 by TOTCHPTS
by_chpts = sorted(
    [r for r in rows if r["TOTCHPTS"].strip()],
    key=lambda r: int(r["TOTCHPTS"]),
    reverse=True,
)[:100]
highest_criminal_history = [row_to_case(r) for r in by_chpts]

# Top 100 by SENTTOT
by_sent = sorted(
    [r for r in rows if r["SENTTOT"].strip()],
    key=lambda r: float(r["SENTTOT"]),
    reverse=True,
)[:100]
longest_sentences = [row_to_case(r) for r in by_sent]

# Category VI analysis
cat6_rows = [r for r in rows if crimhist_cat(r["XCRHISSR"]) == 6]
cat6_sent = [float(r["SENTTOT"]) for r in cat6_rows if r["SENTTOT"].strip()]
cat6_avg_sent = round(sum(cat6_sent) / len(cat6_sent), 1) if cat6_sent else 0
cat6_offenses = Counter()
for r in cat6_rows:
    og = r["OFFGUIDE"].strip()
    if og:
        cat6_offenses[OFFGUIDE_MAP.get(og, "Other")] += 1
cat6_districts = Counter(r["DISTRICT"] for r in cat6_rows)

category_vi = {
    "count": len(cat6_rows),
    "avgSentence": cat6_avg_sent,
    "topOffenseTypes": {k: v for k, v in cat6_offenses.most_common(10)},
    "byDistrict": {k: v for k, v in cat6_districts.most_common(20)},
}

# ─── Sentencing Patterns ───────────────────────────────────────────────────

# Below-guidelines by criminal history
below_by_cat = defaultdict(lambda: {"below": 0, "total": 0})
for r in rows:
    cat = crimhist_cat(r["XCRHISSR"])
    if cat is None:
        continue
    pos = sent_position(r)
    if pos is None:
        continue
    below_by_cat[cat]["total"] += 1
    if pos == "below":
        below_by_cat[cat]["below"] += 1

below_guidelines_by_cat = {
    str(k): round(v["below"] / v["total"] * 100, 1) if v["total"] > 0 else 0
    for k, v in sorted(below_by_cat.items())
}

# Below-guidelines by offense type
below_by_og = defaultdict(lambda: {"below": 0, "total": 0})
for r in rows:
    og = r["OFFGUIDE"].strip()
    if not og:
        continue
    label = OFFGUIDE_MAP.get(og, "Other")
    pos = sent_position(r)
    if pos is None:
        continue
    below_by_og[label]["total"] += 1
    if pos == "below":
        below_by_og[label]["below"] += 1

# Only include categories with enough cases
below_by_offense = {
    k: round(v["below"] / v["total"] * 100, 1)
    for k, v in sorted(below_by_og.items(), key=lambda x: -x[1]["total"])
    if v["total"] >= 50
}

# Below-guidelines by race
below_by_race = defaultdict(lambda: {"below": 0, "total": 0})
for r in rows:
    race = RACE_MAP.get(r["NEWRACE"], "Unknown")
    if race == "Unknown":
        continue
    pos = sent_position(r)
    if pos is None:
        continue
    below_by_race[race]["total"] += 1
    if pos == "below":
        below_by_race[race]["below"] += 1

below_guidelines_by_race = {
    k: round(v["below"] / v["total"] * 100, 1)
    for k, v in sorted(below_by_race.items(), key=lambda x: -x[1]["total"])
    if v["total"] > 0
}

# Below-guidelines by gender
below_by_gender = defaultdict(lambda: {"below": 0, "total": 0})
for r in rows:
    sex = SEX_MAP.get(r["MONSEX"], "Unknown")
    if sex == "Unknown":
        continue
    pos = sent_position(r)
    if pos is None:
        continue
    below_by_gender[sex]["total"] += 1
    if pos == "below":
        below_by_gender[sex]["below"] += 1

below_guidelines_by_gender = {
    k: round(v["below"] / v["total"] * 100, 1)
    for k, v in sorted(below_by_gender.items())
    if v["total"] > 0
}

# Avg sentence by offense type
sent_by_og = defaultdict(list)
for r in rows:
    og = r["OFFGUIDE"].strip()
    if not og:
        continue
    label = OFFGUIDE_MAP.get(og, "Other")
    if r["SENTTOT"].strip():
        try:
            sent_by_og[label].append(float(r["SENTTOT"]))
        except:
            pass

avg_sentence_by_offense = {
    k: round(sum(v) / len(v), 1)
    for k, v in sorted(sent_by_og.items(), key=lambda x: -sum(x[1]) / max(len(x[1]), 1))
    if len(v) >= 20
}

# Firearm enhancement
firearm_rows = [r for r in rows if r["IS924C"] == "1"]
no_firearm_rows = [r for r in rows if r["IS924C"] == "0"]
fw_sent = [float(r["SENTTOT"]) for r in firearm_rows if r["SENTTOT"].strip()]
nfw_sent = [float(r["SENTTOT"]) for r in no_firearm_rows if r["SENTTOT"].strip()]

firearm_enhancement = {
    "count": len(firearm_rows),
    "avgSentenceWith": round(sum(fw_sent) / len(fw_sent), 1) if fw_sent else 0,
    "avgSentenceWithout": round(sum(nfw_sent) / len(nfw_sent), 1) if nfw_sent else 0,
    "pctOfCases": round(len(firearm_rows) / len(rows) * 100, 1),
}

# ─── Disparity Analysis ────────────────────────────────────────────────────

# Avg sentence by race
sent_race = defaultdict(list)
for r in rows:
    race = RACE_MAP.get(r["NEWRACE"], "Unknown")
    if race == "Unknown":
        continue
    if r["SENTTOT"].strip():
        try:
            sent_race[race].append(float(r["SENTTOT"]))
        except:
            pass

sentence_by_race = {
    k: round(sum(v) / len(v), 1)
    for k, v in sorted(sent_race.items(), key=lambda x: -sum(x[1]) / max(len(x[1]), 1))
    if v
}

# Avg sentence by gender
sent_gender = defaultdict(list)
for r in rows:
    sex = SEX_MAP.get(r["MONSEX"], "Unknown")
    if sex == "Unknown":
        continue
    if r["SENTTOT"].strip():
        try:
            sent_gender[sex].append(float(r["SENTTOT"]))
        except:
            pass

sentence_by_gender = {
    k: round(sum(v) / len(v), 1)
    for k, v in sorted(sent_gender.items())
    if v
}

# Avg sentence by education
sent_edu = defaultdict(list)
for r in rows:
    edu = educatn_label(r["EDUCATN"])
    if edu == "Unknown":
        continue
    if r["SENTTOT"].strip():
        try:
            sent_edu[edu].append(float(r["SENTTOT"]))
        except:
            pass

sentence_by_education = {
    k: round(sum(v) / len(v), 1)
    for k, v in sorted(sent_edu.items(), key=lambda x: -sum(x[1]) / max(len(x[1]), 1))
    if len(v) >= 20
}

# ─── Offense Type Analysis ─────────────────────────────────────────────────

offense_detail = {}
for og_code, og_label in OFFGUIDE_MAP.items():
    og_rows = [r for r in rows if r["OFFGUIDE"].strip() == og_code]
    if not og_rows:
        continue
    og_sent = [float(r["SENTTOT"]) for r in og_rows if r["SENTTOT"].strip()]
    og_cats = Counter(crimhist_cat(r["XCRHISSR"]) for r in og_rows if crimhist_cat(r["XCRHISSR"]))
    og_races = Counter(RACE_MAP.get(r["NEWRACE"], "Unknown") for r in og_rows if r["NEWRACE"])
    og_below = [r for r in og_rows if sent_position(r) == "below"]
    if og_code not in offense_detail:
        offense_detail[og_code] = {
            "label": og_label,
            "count": len(og_rows),
            "avgSentence": round(sum(og_sent) / len(og_sent), 1) if og_sent else 0,
            "belowGuidelinesPct": round(len(og_below) / len(og_rows) * 100, 1),
            "criminalHistoryDist": {str(k): v for k, v in sorted(og_cats.items()) if k},
            "raceDist": {k: v for k, v in og_races.most_common() if k != "Unknown"},
        }

# Consolidate duplicate labels
consolidated_offense = defaultdict(lambda: {"count": 0, "sentences": [], "below": 0, "total_pos": 0})
for r in rows:
    og = r["OFFGUIDE"].strip()
    if not og:
        continue
    label = OFFGUIDE_MAP.get(og, "Other")
    consolidated_offense[label]["count"] += 1
    if r["SENTTOT"].strip():
        try:
            consolidated_offense[label]["sentences"].append(float(r["SENTTOT"]))
        except:
            pass
    pos = sent_position(r)
    if pos:
        consolidated_offense[label]["total_pos"] += 1
        if pos == "below":
            consolidated_offense[label]["below"] += 1

offense_summary = {}
for label, d in sorted(consolidated_offense.items(), key=lambda x: -x[1]["count"]):
    sents = d["sentences"]
    offense_summary[label] = {
        "count": d["count"],
        "avgSentence": round(sum(sents) / len(sents), 1) if sents else 0,
        "belowGuidelinesPct": round(d["below"] / d["total_pos"] * 100, 1) if d["total_pos"] > 0 else 0,
        "pctOfTotal": round(d["count"] / len(rows) * 100, 1),
    }

# ─── Assemble Output ───────────────────────────────────────────────────────

output = {
    "meta": {
        "source": "U.S. Sentencing Commission, FY2025 Annual Datafile",
        "note": "All cases are anonymized. No individual identifiers are included.",
        "totalCases": len(rows),
        "fiscalYear": "2025",
    },
    "totalCases": len(rows),
    "summary": {
        "avgAge": round(avg_age, 1),
        "avgSentenceMonths": round(avg_sentence, 1),
        "genderBreakdown": gender_breakdown,
        "genderCounts": {k: sex_counter[k] for k in ["Male", "Female"] if k in sex_counter},
        "raceBreakdown": race_breakdown,
        "raceCounts": {k: race_counter[k] for k in ["White", "Black", "Hispanic", "Other"] if k in race_counter},
        "educationBreakdown": education_breakdown,
        "citizenshipBreakdown": citizenship_breakdown,
    },
    "criminalHistoryAnalysis": {
        "categoryDistribution": category_distribution,
        "avgSentenceByCategory": avg_sentence_by_category,
        "avgAgeByCategory": avg_age_by_category,
        "offenseTypeByCategory": offense_type_by_category,
        "belowGuidelinesByCategory": below_guidelines_by_cat,
    },
    "worstOffenders": {
        "highestCriminalHistory": highest_criminal_history,
        "longestSentences": longest_sentences,
        "categoryVI": category_vi,
    },
    "sentencingPatterns": {
        "belowGuidelines": {
            "byCriminalHistory": below_guidelines_by_cat,
            "byOffenseType": below_by_offense,
            "byRace": below_guidelines_by_race,
            "byGender": below_guidelines_by_gender,
        },
        "avgSentenceByOffenseType": avg_sentence_by_offense,
        "offenseSummary": offense_summary,
        "firearmEnhancement": firearm_enhancement,
    },
    "disparityAnalysis": {
        "sentenceByRace": sentence_by_race,
        "sentenceByGender": sentence_by_gender,
        "sentenceByEducation": sentence_by_education,
        "belowGuidelinesByRace": below_guidelines_by_race,
        "belowGuidelinesByGender": below_guidelines_by_gender,
        "casesbyRace": {k: race_counter[k] for k in ["White", "Black", "Hispanic", "Other"] if k in race_counter},
        "casesByGender": {k: sex_counter[k] for k in ["Male", "Female"] if k in sex_counter},
    },
}

OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
with open(OUT_PATH, "w") as f:
    json.dump(output, f, indent=2)

print(f"\n✓ Written to {OUT_PATH}")
print(f"  Total cases: {len(rows):,}")
print(f"  Avg age: {avg_age:.1f}")
print(f"  Avg sentence: {avg_sentence:.1f} months")
print(f"  Category VI cases: {len(cat6_rows):,}")
print(f"  Firearm enhancement cases: {len(firearm_rows):,}")
print()
print("Criminal History Distribution:")
for cat in sorted(cat_counts.keys()):
    pct = cat_counts[cat] / len(rows) * 100
    print(f"  Category {cat}: {cat_counts[cat]:,} cases ({pct:.1f}%)")
