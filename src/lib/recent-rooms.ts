export type RecentRoom = {
  slug: string;
  name: string;
  visitedAt: string;
};

export const RECENT_ROOMS_KEY = "turn:recent-rooms";
export const MAX_RECENT_ROOMS = 10;

/** Puts the room at the front of the list, replacing any older entry for it. */
export function addRecentRoom(
  rooms: RecentRoom[],
  room: { slug: string; name: string },
  visitedAt: string,
): RecentRoom[] {
  return [
    { slug: room.slug, name: room.name, visitedAt },
    ...rooms.filter(({ slug }) => slug !== room.slug),
  ].slice(0, MAX_RECENT_ROOMS);
}

export function removeRecentRoom(rooms: RecentRoom[], slug: string): RecentRoom[] {
  return rooms.filter((room) => room.slug !== slug);
}

/** Reads a stored list, dropping anything that is not a well-formed entry. */
export function parseRecentRooms(raw: string | null): RecentRoom[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is RecentRoom =>
          typeof item === "object" &&
          item !== null &&
          typeof item.slug === "string" &&
          typeof item.name === "string" &&
          typeof item.visitedAt === "string",
      )
      .slice(0, MAX_RECENT_ROOMS);
  } catch {
    return [];
  }
}

// Browser storage can be missing or blocked (private mode), so every access is guarded.
export function loadRecentRooms(): RecentRoom[] {
  try {
    return parseRecentRooms(window.localStorage.getItem(RECENT_ROOMS_KEY));
  } catch {
    return [];
  }
}

function saveRecentRooms(rooms: RecentRoom[]) {
  try {
    window.localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(rooms));
  } catch {
    // Remembering rooms is a convenience; the app keeps working without it.
  }
}

export function rememberRoom(room: { slug: string; name: string }) {
  saveRecentRooms(addRecentRoom(loadRecentRooms(), room, new Date().toISOString()));
}

export function forgetRoom(slug: string) {
  const rooms = loadRecentRooms();
  const next = removeRecentRoom(rooms, slug);
  if (next.length !== rooms.length) saveRecentRooms(next);
  return next;
}
