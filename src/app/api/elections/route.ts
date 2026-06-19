import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'data', 'master', 'judge-elections.json');
    const raw = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  } catch {
    // File doesn't exist yet — return empty array
    return NextResponse.json([], {
      headers: { 'Cache-Control': 'public, max-age=300' },
    });
  }
}
