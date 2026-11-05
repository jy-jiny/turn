import { describe, expect, it } from "vitest";
import { DUPLICATE_WINDOW_MS, describeRecentPurchase, findRecentPurchase } from "./recent-purchase";

const at = (iso: string) => Date.parse(iso);
const purchase = (createdAt: string, buyerName = "고주영") => ({
  id: createdAt,
  buyerId: "b1",
  buyerName,
  createdAt,
});

describe("findRecentPurchase", () => {
  it("returns nothing when there are no purchases", () => {
    expect(findRecentPurchase([], at("2026-11-05T07:00:00Z"))).toBeNull();
  });

  it("flags the latest purchase made within five minutes", () => {
    const purchases = [purchase("2026-11-05T06:57:10Z"), purchase("2026-11-05T06:00:00Z", "남동훈")];
    expect(findRecentPurchase(purchases, at("2026-11-05T07:00:00Z"))).toEqual({
      buyerName: "고주영",
      minutesAgo: 2,
    });
  });

  it("stops asking once five minutes have passed", () => {
    const now = at("2026-11-05T07:00:00Z");
    expect(findRecentPurchase([purchase(new Date(now - DUPLICATE_WINDOW_MS).toISOString())], now)).toBeNull();
    expect(
      findRecentPurchase([purchase(new Date(now - DUPLICATE_WINDOW_MS + 1000).toISOString())], now),
    ).toEqual({ buyerName: "고주영", minutesAgo: 4 });
  });

  it("treats a purchase slightly in the future (clock skew) as just now", () => {
    expect(findRecentPurchase([purchase("2026-11-05T07:00:20Z")], at("2026-11-05T07:00:00Z"))).toEqual({
      buyerName: "고주영",
      minutesAgo: 0,
    });
  });

  it("ignores an unreadable timestamp", () => {
    expect(findRecentPurchase([purchase("not a date")], at("2026-11-05T07:00:00Z"))).toBeNull();
  });
});

describe("describeRecentPurchase", () => {
  it("says 방금 under a minute and N분 전에 otherwise", () => {
    expect(describeRecentPurchase({ buyerName: "고주영", minutesAgo: 0 })).toBe("방금 고주영님 구매가 기록됐어요.");
    expect(describeRecentPurchase({ buyerName: "남동훈", minutesAgo: 3 })).toBe("3분 전에 남동훈님 구매가 기록됐어요.");
  });
});
