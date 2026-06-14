import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/supabase-server';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q') || '';

  if (!q || q.length < 2) {
    return NextResponse.json({ stateJudges: [], federalJudges: [], counties: [] });
  }

  try {
    const supabase = createServerClient();
    const pattern = `%${q}%`;

    const [stateRes, federalRes, countyRes] = await Promise.all([
      supabase
        .from('state_judges')
        .select('slug, name, state_code, county, leniency_score, total_cases')
        .ilike('name', pattern)
        .limit(5),
      supabase
        .from('federal_judges')
        .select('cl_id, slug, name, court, state, party, is_active')
        .or(`name.ilike.${pattern},court.ilike.${pattern},court_full.ilike.${pattern}`)
        .limit(5),
      supabase
        .from('county_profiles')
        .select('slug, name, state, leniency_score, total_cases')
        .ilike('name', pattern)
        .limit(5),
    ]);

    return NextResponse.json({
      stateJudges: stateRes.data ?? [],
      federalJudges: federalRes.data ?? [],
      counties: countyRes.data ?? [],
    });
  } catch (err) {
    console.error('[/api/search]', err);
    return NextResponse.json(
      { error: 'Search failed', stateJudges: [], federalJudges: [], counties: [] },
      { status: 500 }
    );
  }
}
