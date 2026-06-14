import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/supabase-server';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const state = searchParams.get('state') || '';
  const sort = searchParams.get('sort') || 'leniency';
  const dir = searchParams.get('dir') || 'desc';
  const limit = Math.min(Number(searchParams.get('limit') || '100'), 500);

  try {
    const supabase = createServerClient();
    let query = supabase
      .from('county_profiles')
      .select('*', { count: 'exact' });

    if (state) {
      query = query.eq('state', state.toUpperCase());
    }

    const ascending = dir === 'asc';
    switch (sort) {
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      case 'cases':
        query = query.order('total_cases', { ascending });
        break;
      case 'prison':
        query = query.order('prison_rate', { ascending });
        break;
      case 'leniency':
      default:
        query = query.order('leniency_score', { ascending });
        break;
    }

    query = query.limit(limit);
    const { data, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      counties: data ?? [],
      total: count ?? 0,
    });
  } catch (err) {
    console.error('[/api/counties]', err);
    return NextResponse.json(
      { error: 'Failed to fetch counties', counties: [], total: 0 },
      { status: 500 }
    );
  }
}
