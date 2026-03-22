import { NextResponse } from 'next/server';
import { queryOverpass } from '@/lib/overpass';

export async function POST(request: Request) {
  try {
    const { south, west, north, east } = await request.json();

    if ([south, west, north, east].some(v => typeof v !== 'number')) {
      return NextResponse.json({ error: 'Invalid bounding box' }, { status: 400 });
    }

    const data = await queryOverpass(south, west, north, east);
    return NextResponse.json(data);
  } catch (e) {
    console.error('Overpass API error:', e);
    return NextResponse.json(
      { error: 'Failed to query Overpass API' },
      { status: 500 }
    );
  }
}
