import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/supabase-server';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q') || '';
  const state = searchParams.get('state') || '';
  const county = searchParams.get('county') || '';
  const sort = searchParams.get('sort') || 'leniency';
  const dir = searchParams.get('dir') || 'desc';
  const limit = Math.min(Number(searchParams.get('limit') || '50'), 200);
  const offset = Number(searchParams.get('offset') || '0');
  const minCases = Number(searchParams.get('minCases') || '0');

  try {
    const supabase = createServerClient();
    let query = supabase
      .from('state_judges')
      .select('*', { count: 'exact' });

    // Full-text search on name
    if (q) {
      query = query.ilike('name', `%${q}%`);
    }
    if (state) {
      query = query.eq('state_code', state.toUpperCase());
    }
    if (county) {
      query = query.ilike('county', `%${county}%`);
    }
    if (minCases > 0) {
      query = query.gte('total_cases', minCases);
    }

    // Sorting
    const ascending = dir === 'asc';
    switch (sort) {
      case 'cases':
        query = query.order('total_cases', { ascending });
        break;
      case 'prison':
        query = query.order('prison_rate', { ascending });
        break;
      case 'probation':
        query = query.order('probation_rate', { ascending });
        break;
      case 'leniency':
      default:
        query = query.order('leniency_score', { ascending });
        break;
    }

    query = query.range(offset, offset + limit - 1);
    const { data, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      judges: data ?? [],
      total: count ?? 0,
      page: Math.floor(offset / limit),
      pageSize: limit,
    });
  } catch (err) {
    console.error('[/api/judges]', err);
    return NextResponse.json(
      { error: 'Failed to fetch judges', judges: [], total: 0, page: 0, pageSize: limit },
      { status: 500 }
    );
  }
}
