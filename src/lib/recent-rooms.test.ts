import { describe, expect, it } from "vitest";
import {
  MAX_RECENT_ROOMS,
  addRecentRoom,
  parseRecentRooms,
  removeRecentRoom,
  type RecentRoom,
} from "./recent-rooms";

const older: RecentRoom = { slug: "a", name: "오후 모임", visitedAt: "2026-11-01T00:00:00.000Z" };

describe("recent rooms", () => {
  it("puts a newly visited room first", () => {
    const rooms = addRecentRoom([older], { slug: "b", name: "점심 원정대" }, "2026-11-05T00:00:00.000Z");
    expect(rooms.map(({ slug }) => slug)).toEqual(["b", "a"]);
  });

  it("moves a revisited room to the front with its latest name", () => {
    const rooms = addRecentRoom(
      [{ slug: "b", name: "x", visitedAt: "2026-11-02T00:00:00.000Z" }, older],
      { slug: "a", name: "새 이름" },
      "2026-11-05T00:00:00.000Z",
    );
    expect(rooms).toEqual([
      { slug: "a", name: "새 이름", visitedAt: "2026-11-05T00:00:00.000Z" },
      { slug: "b", name: "x", visitedAt: "2026-11-02T00:00:00.000Z" },
    ]);
  });

  it(`keeps at most ${MAX_RECENT_ROOMS} rooms`, () => {
    let rooms: RecentRoom[] = [];
    for (let index = 0; index < MAX_RECENT_ROOMS + 3; index += 1) {
      rooms = addRecentRoom(rooms, { slug: `s${index}`, name: `방 ${index}` }, "2026-11-05T00:00:00.000Z");
    }
    expect(rooms).toHaveLength(MAX_RECENT_ROOMS);
    expect(rooms[0].slug).toBe(`s${MAX_RECENT_ROOMS + 2}`);
  });

  it("removes a room by slug", () => {
    expect(removeRecentRoom([older], "a")).toEqual([]);
  });

  it("ignores broken or malformed stored data", () => {
    expect(parseRecentRooms(null)).toEqual([]);
    expect(parseRecentRooms("not json")).toEqual([]);
    expect(parseRecentRooms(JSON.stringify({ slug: "a" }))).toEqual([]);
    expect(parseRecentRooms(JSON.stringify([older, { slug: 1 }, null]))).toEqual([older]);
  });
});
