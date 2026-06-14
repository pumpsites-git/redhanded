import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/supabase-server';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q') || '';
  const state = searchParams.get('state') || '';
  const party = searchParams.get('party') || '';
  const sort = searchParams.get('sort') || 'years';
  const dir = searchParams.get('dir') || 'desc';
  const limit = Math.min(Number(searchParams.get('limit') || '20'), 200);
  const offset = Number(searchParams.get('offset') || '0');

  try {
    const supabase = createServerClient();
    let query = supabase
      .from('federal_judges')
      .select('*', { count: 'exact' });

    if (q) {
      query = query.or(
        `name.ilike.%${q}%,court.ilike.%${q}%,court_full.ilike.%${q}%,state.ilike.%${q}%`
      );
    }
    if (state) {
      query = query.eq('state', state.toUpperCase());
    }
    if (party) {
      query = query.eq('party', party);
    }

    const ascending = dir === 'asc';
    switch (sort) {
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      case 'state':
        query = query.order('state', { ascending: true }).order('name', { ascending: true });
        break;
      case 'years':
      default:
        query = query.order('years_serving', { ascending });
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
    console.error('[/api/federal]', err);
    return NextResponse.json(
      { error: 'Failed to fetch federal judges', judges: [], total: 0, page: 0, pageSize: limit },
      { status: 500 }
    );
  }
}
