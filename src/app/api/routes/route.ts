import { NextResponse, type NextRequest } from "next/server";
import { listRoutes, createRoute, createRoutesBatch } from "@/lib/routes";
import { getUser } from "@/lib/supabase/auth";

export async function GET() {
  try {
    const routes = await listRoutes();
    return NextResponse.json(routes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list routes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Batch import (localStorage migration)
    if (Array.isArray(body)) {
      await createRoutesBatch(body, user.id);
      return NextResponse.json({ success: true, count: body.length }, { status: 201 });
    }

    // Single route save
    const id = await createRoute(body, user.id);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save route";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
