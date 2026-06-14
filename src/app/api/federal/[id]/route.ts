import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/supabase-server';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Props) {
  const { id } = await params;

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('federal_judges')
      .select('*')
      .eq('cl_id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Federal judge not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[/api/federal/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch federal judge' }, { status: 500 });
  }
}
