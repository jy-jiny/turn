import type { Purchase } from "@/lib/types";

/** How long after a purchase another one asks for confirmation. */
export const DUPLICATE_WINDOW_MS = 5 * 60 * 1000;

export type RecentPurchase = {
  buyerName: string;
  minutesAgo: number;
};

/**
 * Returns the latest purchase if it happened within the window, so a second
 * tap (often by another person) can be confirmed before the turn moves again.
 * `purchases` is newest first, as the API returns it.
 */
export function findRecentPurchase(
  purchases: Purchase[],
  now: number,
  windowMs = DUPLICATE_WINDOW_MS,
): RecentPurchase | null {
  const latest = purchases[0];
  if (!latest) return null;

  const createdAt = Date.parse(latest.createdAt);
  if (Number.isNaN(createdAt)) return null;

  // A phone clock slightly behind the server makes the gap negative; treat it as "just now".
  const elapsed = Math.max(0, now - createdAt);
  if (elapsed >= windowMs) return null;

  return { buyerName: latest.buyerName, minutesAgo: Math.floor(elapsed / 60_000) };
}

export function describeRecentPurchase({ buyerName, minutesAgo }: RecentPurchase) {
  const when = minutesAgo < 1 ? "방금" : `${minutesAgo}분 전에`;
  return `${when} ${buyerName}님 구매가 기록됐어요.`;
}
