import { NextResponse } from "next/server";
import type { Member } from "@/lib/types";
import { StoreError } from "./store";

export function jsonError(error: unknown) {
  if (error instanceof StoreError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: "잠시 후 다시 시도해 주세요.", code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    throw new StoreError("요청 형식이 올바르지 않습니다.", 400, "INVALID_JSON");
  }
}

export function parseRoomName(value: unknown) {
  const name = typeof value === "string" ? value.trim() : "";

  if (name.length < 1 || name.length > 30) {
    throw new StoreError("방 이름은 1~30자로 입력해 주세요.", 400, "INVALID_ROOM_NAME");
  }

  return name;
}

export function parseMemberNames(value: unknown) {
  if (!Array.isArray(value) || value.length !== 3) {
    throw new StoreError("멤버 세 명의 이름을 입력해 주세요.", 400, "INVALID_MEMBERS");
  }

  const names = value.map((item) => (typeof item === "string" ? item.trim() : ""));

  if (names.some((name) => name.length < 1 || name.length > 12)) {
    throw new StoreError("이름은 각각 1~12자로 입력해 주세요.", 400, "INVALID_MEMBERS");
  }

  if (new Set(names).size !== names.length) {
    throw new StoreError("서로 다른 이름을 입력해 주세요.", 400, "DUPLICATE_MEMBERS");
  }

  return names;
}

export function parseMembers(value: unknown): Member[] {
  if (!Array.isArray(value) || value.length !== 3) {
    throw new StoreError("멤버 세 명의 정보를 확인해 주세요.", 400, "INVALID_MEMBERS");
  }

  const members = value.map((item, position) => {
    const candidate = item as Partial<Member> | null;
    const id = typeof candidate?.id === "string" ? candidate.id : "";
    const name = typeof candidate?.name === "string" ? candidate.name.trim() : "";

    if (!id || name.length < 1 || name.length > 12) {
      throw new StoreError("멤버 정보를 확인해 주세요.", 400, "INVALID_MEMBERS");
    }

    return { id, name, position };
  });

  if (new Set(members.map(({ id }) => id)).size !== 3) {
    throw new StoreError("멤버 정보가 중복되었습니다.", 400, "INVALID_MEMBERS");
  }

  if (new Set(members.map(({ name }) => name)).size !== 3) {
    throw new StoreError("서로 다른 이름을 입력해 주세요.", 400, "DUPLICATE_MEMBERS");
  }

  return members;
}

export function parseExpectedVersion(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new StoreError("방 버전이 올바르지 않습니다.", 400, "INVALID_VERSION");
  }

  return value;
}