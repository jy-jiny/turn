import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadRoomsFromFile, saveRoomsToFile } from "./room-file";

const directories: string[] = [];

function makeFilePath() {
  const directory = mkdtempSync(join(tmpdir(), "coffee-turn-"));
  directories.push(directory);
  return join(directory, "nested", "rooms.json");
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("room file storage", () => {
  it("returns no rooms when the file does not exist yet", () => {
    expect(loadRoomsFromFile(makeFilePath()).size).toBe(0);
  });

  it("keeps rooms across a save and a fresh load", () => {
    const filePath = makeFilePath();
    const rooms = new Map([
      ["abc", { slug: "abc", name: "오후 커피", version: 3 }],
      ["def", { slug: "def", name: "아침 커피", version: 1 }],
    ]);

    saveRoomsToFile(filePath, rooms);
    const loaded = loadRoomsFromFile<{ slug: string; name: string; version: number }>(filePath);

    expect([...loaded.values()]).toEqual([...rooms.values()]);
  });

  it("writes an empty room list in the versioned format", () => {
    const filePath = makeFilePath();
    saveRoomsToFile(filePath, new Map());
    expect(JSON.parse(readFileSync(filePath, "utf8"))).toEqual({ version: 1, rooms: [] });
  });

  it("rejects a file in an unknown format", () => {
    const filePath = makeFilePath();
    saveRoomsToFile(filePath, new Map());
    writeFileSync(filePath, JSON.stringify({ version: 2, rooms: [] }));
    expect(() => loadRoomsFromFile(filePath)).toThrow("Unsupported room file format");
  });
});
