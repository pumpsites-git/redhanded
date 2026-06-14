import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/supabase-server';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: Props) {
  const { slug } = await params;

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('state_judges')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Judge not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[/api/judges/[slug]]', err);
    return NextResponse.json({ error: 'Failed to fetch judge' }, { status: 500 });
  }
}
