import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { moveBuyerToBack } from "@/lib/queue";
import type { RoomState, RoomUpdate, StorageMode } from "@/lib/types";

type StoredPurchase = RoomState["purchases"][number] & {
  queueBefore: string[];
};

type StoredRoom = Omit<RoomState, "purchases" | "storageMode"> & {
  purchases: StoredPurchase[];
};

type RoomStore = {
  createRoom(name: string, memberNames: string[]): Promise<RoomState>;
  getRoom(slug: string): Promise<RoomState>;
  recordPurchase(slug: string, buyerId: string, expectedVersion: number): Promise<RoomState>;
  undoLastPurchase(slug: string, expectedVersion: number): Promise<RoomState>;
  updateRoom(slug: string, update: RoomUpdate): Promise<RoomState>;
};

export class StoreError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
  }
}

const globalStore = globalThis as typeof globalThis & {
  coffeeTurnRooms?: Map<string, StoredRoom>;
};

const memoryRooms = globalStore.coffeeTurnRooms ?? new Map<string, StoredRoom>();
globalStore.coffeeTurnRooms = memoryRooms;

function makeSlug() {
  return randomBytes(18).toString("base64url");
}

function cloneState(room: StoredRoom, storageMode: StorageMode): RoomState {
  return {
    slug: room.slug,
    name: room.name,
    version: room.version,
    updatedAt: room.updatedAt,
    members: room.members.map((member) => ({ ...member })),
    purchases: room.purchases
      .slice(-30)
      .reverse()
      .map((purchase) => ({
        id: purchase.id,
        buyerId: purchase.buyerId,
        buyerName: purchase.buyerName,
        createdAt: purchase.createdAt,
      })),
    storageMode,
  };
}

function getMemoryRoom(slug: string) {
  const room = memoryRooms.get(slug);

  if (!room) {
    throw new StoreError("방을 찾을 수 없습니다.", 404, "ROOM_NOT_FOUND");
  }

  return room;
}

function assertVersion(room: StoredRoom, expectedVersion: number) {
  if (room.version !== expectedVersion) {
    throw new StoreError(
      "다른 기기에서 먼저 변경했습니다. 최신 순서를 불러왔어요.",
      409,
      "VERSION_CONFLICT",
    );
  }
}

const memoryStore: RoomStore = {
  async createRoom(name, memberNames) {
    const now = new Date().toISOString();
    const slug = makeSlug();
    const room: StoredRoom = {
      slug,
      name,
      version: 1,
      updatedAt: now,
      members: memberNames.map((memberName, position) => ({
        id: randomUUID(),
        name: memberName,
        position,
      })),
      purchases: [],
    };

    memoryRooms.set(slug, room);
    return cloneState(room, "development-memory");
  },

  async getRoom(slug) {
    return cloneState(getMemoryRoom(slug), "development-memory");
  },

  async recordPurchase(slug, buyerId, expectedVersion) {
    const room = getMemoryRoom(slug);
    assertVersion(room, expectedVersion);
    const buyer = room.members.find((member) => member.id === buyerId);

    if (!buyer) {
      throw new StoreError("구매자를 찾을 수 없습니다.", 400, "INVALID_BUYER");
    }

    const queueBefore = room.members.map(({ id }) => id);
    room.purchases.push({
      id: randomUUID(),
      buyerId,
      buyerName: buyer.name,
      createdAt: new Date().toISOString(),
      queueBefore,
    });
    room.members = moveBuyerToBack(room.members, buyerId).map((member, position) => ({
      ...member,
      position,
    }));
    room.version += 1;
    room.updatedAt = new Date().toISOString();
    return cloneState(room, "development-memory");
  },

  async undoLastPurchase(slug, expectedVersion) {
    const room = getMemoryRoom(slug);
    assertVersion(room, expectedVersion);
    const purchase = room.purchases.pop();

    if (!purchase) {
      throw new StoreError("취소할 구매 기록이 없습니다.", 400, "NOTHING_TO_UNDO");
    }

    const positionById = new Map(purchase.queueBefore.map((id, position) => [id, position]));
    const restoredMemberCount = positionById.size;
    room.members = [...room.members]
      .sort(
        (left, right) =>
          (positionById.get(left.id) ?? restoredMemberCount + left.position) -
          (positionById.get(right.id) ?? restoredMemberCount + right.position),
      )
      .map((member, position) => ({ ...member, position }));
    room.version += 1;
    room.updatedAt = new Date().toISOString();
    return cloneState(room, "development-memory");
  },

  async updateRoom(slug, update) {
    const room = getMemoryRoom(slug);
    assertVersion(room, update.expectedVersion);

    room.name = update.name;
    room.members = update.members.map((member, position) => ({ ...member, position }));
    room.version += 1;
    room.updatedAt = new Date().toISOString();
    return cloneState(room, "development-memory");
  },
};

function makeSupabaseStore(url: string, serviceRoleKey: string): RoomStore {
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  async function call(functionName: string, parameters: Record<string, unknown>) {
    const { data, error } = await supabase.rpc(functionName, parameters);

    if (error) {
      const message = error.message.replace(/^.*?: /, "");
      if (message.includes("ROOM_NOT_FOUND")) {
        throw new StoreError("방을 찾을 수 없습니다.", 404, "ROOM_NOT_FOUND");
      }
      if (message.includes("VERSION_CONFLICT")) {
        throw new StoreError(
          "다른 기기에서 먼저 변경했습니다. 최신 순서를 불러왔어요.",
          409,
          "VERSION_CONFLICT",
        );
      }
      throw new StoreError("저장 중 문제가 생겼습니다.", 500, "DATABASE_ERROR");
    }

    return { ...(data as Omit<RoomState, "storageMode">), storageMode: "supabase" as const };
  }

  return {
    createRoom(name, memberNames) {
      return call("create_room", {
        p_slug: makeSlug(),
        p_name: name,
        p_member_names: memberNames,
      });
    },
    getRoom(slug) {
      return call("get_room_state", { p_slug: slug });
    },
    recordPurchase(slug, buyerId, expectedVersion) {
      return call("record_purchase", {
        p_slug: slug,
        p_buyer_id: buyerId,
        p_expected_version: expectedVersion,
      });
    },
    undoLastPurchase(slug, expectedVersion) {
      return call("undo_last_purchase", {
        p_slug: slug,
        p_expected_version: expectedVersion,
      });
    },
    updateRoom(slug, update) {
      return call("update_room", {
        p_slug: slug,
        p_name: update.name,
        p_members: update.members,
        p_expected_version: update.expectedVersion,
      });
    },
  };
}

export function getRoomStore(): RoomStore {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceRoleKey) {
    return makeSupabaseStore(url, serviceRoleKey);
  }

  if (process.env.NODE_ENV === "development") {
    return memoryStore;
  }

  throw new StoreError(
    "서버 저장소가 설정되지 않았습니다.",
    503,
    "STORAGE_NOT_CONFIGURED",
  );
}