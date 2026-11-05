import { NextResponse } from "next/server";
import {
  jsonError,
  parseExpectedVersion,
  parseMembers,
  parseRoomName,
  readJson,
} from "@/lib/server/http";
import { getRoomStore } from "@/lib/server/store";

type RouteContext = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const room = await getRoomStore().getRoom(slug);
    return NextResponse.json(room, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const body = await readJson(request);
    const room = await getRoomStore().updateRoom(slug, {
      name: parseRoomName(body.name),
      members: parseMembers(body.members),
      expectedVersion: parseExpectedVersion(body.expectedVersion),
    });
    return NextResponse.json(room);
  } catch (error) {
    return jsonError(error);
  }
}