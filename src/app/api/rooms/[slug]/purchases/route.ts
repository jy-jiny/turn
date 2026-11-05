import { NextResponse } from "next/server";
import { jsonError, parseExpectedVersion, readJson } from "@/lib/server/http";
import { StoreError, getRoomStore } from "@/lib/server/store";

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const body = await readJson(request);
    const buyerId = typeof body.buyerId === "string" ? body.buyerId : "";

    if (!buyerId) {
      throw new StoreError("구매자를 선택해 주세요.", 400, "INVALID_BUYER");
    }

    const room = await getRoomStore().recordPurchase(
      slug,
      buyerId,
      parseExpectedVersion(body.expectedVersion),
    );
    return NextResponse.json(room);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const body = await readJson(request);
    const room = await getRoomStore().undoLastPurchase(
      slug,
      parseExpectedVersion(body.expectedVersion),
    );
    return NextResponse.json(room);
  } catch (error) {
    return jsonError(error);
  }
}