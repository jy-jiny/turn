import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type RoomFileContents<Room> = {
  version: 1;
  rooms: Room[];
};

/**
 * Loads every room saved in a local JSON file. A missing file means no rooms yet.
 */
export function loadRoomsFromFile<Room extends { slug: string }>(filePath: string) {
  const rooms = new Map<string, Room>();

  if (!existsSync(filePath)) {
    return rooms;
  }

  const parsed = JSON.parse(readFileSync(filePath, "utf8")) as RoomFileContents<Room>;

  if (parsed.version !== 1 || !Array.isArray(parsed.rooms)) {
    throw new Error(`Unsupported room file format: ${filePath}`);
  }

  for (const room of parsed.rooms) {
    rooms.set(room.slug, room);
  }

  return rooms;
}

/**
 * Writes all rooms to a temporary file and renames it over the old one, so a
 * power cut never leaves a half-written file behind.
 */
export function saveRoomsToFile<Room>(filePath: string, rooms: Map<string, Room>) {
  mkdirSync(dirname(filePath), { recursive: true });
  const contents: RoomFileContents<Room> = { version: 1, rooms: [...rooms.values()] };
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, JSON.stringify(contents), { encoding: "utf8", mode: 0o600 });
  renameSync(temporaryPath, filePath);
}
