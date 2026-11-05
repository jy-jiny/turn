import { NextResponse } from "next/server";
import { jsonError, parseMemberNames, parseRoomName, readJson } from "@/lib/server/http";
import { getRoomStore } from "@/lib/server/store";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const room = await getRoomStore().createRoom(
      parseRoomName(body.name),
      parseMemberNames(body.memberNames),
    );
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}