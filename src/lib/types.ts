export const MIN_MEMBERS = 1;
export const MAX_MEMBERS = 12;

export type Member = {
  id: string;
  name: string;
  position: number;
};

export type Purchase = {
  id: string;
  buyerId: string;
  buyerName: string;
  createdAt: string;
};

export type StorageMode = "supabase" | "development-memory";

export type RoomState = {
  slug: string;
  name: string;
  version: number;
  updatedAt: string;
  members: Member[];
  purchases: Purchase[];
  storageMode: StorageMode;
};

export type RoomUpdate = {
  name: string;
  members: Member[];
  expectedVersion: number;
};