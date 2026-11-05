import type { RoomState } from "@/lib/types";

export class RoomApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
  }
}

export async function requestRoom(path: string, init?: RequestInit): Promise<RoomState> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body = (await response.json()) as RoomState | { error?: string; code?: string };

  if (!response.ok) {
    const error = body as { error?: string; code?: string };
    throw new RoomApiError(
      error.error ?? "잠시 후 다시 시도해 주세요.",
      response.status,
      error.code,
    );
  }

  return body as RoomState;
}