import { NextResponse, type NextRequest } from "next/server";
import { getRoute, updateRoute, deleteRoute } from "@/lib/routes";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const route = await getRoute(id);
    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }
    return NextResponse.json(route);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get route";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    await updateRoute(id, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update route";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await deleteRoute(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete route";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
