import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/supabase-server';

// Fallback static values from pipeline data
const STATIC_STATS = {
  totalStateJudges: 236,
  totalFederalJudges: 9396,
  totalCounties: 67,
  totalCases: 3876543,
  statesCovered: 2,
};

export async function GET() {
  try {
    const supabase = createServerClient();

    // Run count queries in parallel
    const [
      { count: stateCount },
      { count: federalCount },
      { count: countyCount },
      { data: topLenient },
      { data: leastLenient },
    ] = await Promise.all([
      supabase.from('state_judges').select('*', { count: 'exact', head: true }),
      supabase.from('federal_judges').select('*', { count: 'exact', head: true }),
      supabase.from('county_profiles').select('*', { count: 'exact', head: true }),
      supabase
        .from('state_judges')
        .select('slug, name, leniency_score, state_code, county')
        .order('leniency_score', { ascending: false })
        .gte('total_cases', 30)
        .limit(5),
      supabase
        .from('state_judges')
        .select('slug, name, leniency_score, state_code, county')
        .order('leniency_score', { ascending: true })
        .gte('total_cases', 30)
        .limit(5),
    ]);

    return NextResponse.json({
      totalStateJudges: stateCount ?? STATIC_STATS.totalStateJudges,
      totalFederalJudges: federalCount ?? STATIC_STATS.totalFederalJudges,
      totalCounties: countyCount ?? STATIC_STATS.totalCounties,
      totalCases: STATIC_STATS.totalCases,
      statesCovered: STATIC_STATS.statesCovered,
      topLenient: topLenient ?? [],
      leastLenient: leastLenient ?? [],
    });
  } catch (err) {
    console.error('[/api/stats]', err);
    return NextResponse.json(STATIC_STATS);
  }
}
