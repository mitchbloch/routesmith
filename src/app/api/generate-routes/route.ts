import { NextResponse } from 'next/server';
import type { UserPreferences } from '@/lib/types';
import { boundingBox, milesToMeters, kmToMeters } from '@/lib/geometry';
import { queryOverpass } from '@/lib/overpass';
import { generateRoutes } from '@/lib/routeGenerator';

export async function POST(request: Request) {
  try {
    const preferences: UserPreferences = await request.json();

    if (!preferences.startLocation?.lat || !preferences.startLocation?.lng) {
      return NextResponse.json({ error: 'Missing start location' }, { status: 400 });
    }

    const toMeters = preferences.distanceUnit === 'miles' ? milesToMeters : kmToMeters;
    const maxMeters = toMeters(preferences.distanceMax);
    const radius = Math.max(maxMeters, 3000);

    const bbox = boundingBox(
      preferences.startLocation.lat,
      preferences.startLocation.lng,
      radius
    );

    const overpassData = await queryOverpass(bbox.south, bbox.west, bbox.north, bbox.east);
    const routes = await generateRoutes(preferences, overpassData);

    return NextResponse.json({ routes });
  } catch (e) {
    console.error('Route generation error:', e);
    return NextResponse.json(
      { error: 'Failed to generate routes' },
      { status: 500 }
    );
  }
}
