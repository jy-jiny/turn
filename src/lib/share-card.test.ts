import { describe, expect, it } from "vitest";
import { MAX_CARD_CHIPS, buildShareCardContent } from "./share-card";

const member = (name: string, position: number) => ({ id: name, name, position });
const url = "https://example.test/r/abc";
const now = new Date(2026, 10, 6, 14, 33);

describe("buildShareCardContent", () => {
  it("announces who bought and whose turn is next", () => {
    const content = buildShareCardContent(
      {
        name: "저당 원정대",
        members: [member("남동훈", 0), member("태민지", 1), member("고주영", 2)],
        purchases: [
          { id: "p1", buyerId: "고주영", buyerName: "고주영", createdAt: new Date(2026, 10, 6, 14, 30).toISOString() },
        ],
      },
      now,
      url,
    );

    expect(content).toEqual({
      badge: "저당 원정대 · 턴",
      subline: "고주영님이 샀어요",
      headline: "남동훈님 차례!",
      chips: [
        { label: "1 남동훈", current: true },
        { label: "2 태민지", current: false },
        { label: "3 고주영", current: false },
      ],
      moreCount: 0,
      timeLabel: "11월 6일 오후 2:30",
      shareText: `고주영님이 샀어요. 다음은 남동훈님 차례예요! (저당 원정대)\n${url}`,
    });
  });

  it("works before anyone has bought, using the current time", () => {
    const content = buildShareCardContent({ name: "점심", members: [member("가", 0)], purchases: [] }, now, url);
    expect(content.subline).toBe("오늘의 순서");
    expect(content.timeLabel).toBe("11월 6일 오후 2:33");
    expect(content.shareText).toBe(`오늘은 가님 차례예요! (점심)\n${url}`);
  });

  it(`shows at most ${MAX_CARD_CHIPS} chips and counts the rest`, () => {
    const members = ["a", "b", "c", "d", "e", "f"].map(member);
    const content = buildShareCardContent({ name: "큰 방", members, purchases: [] }, now, url);
    expect(content.chips.map((chip) => chip.label)).toEqual(["1 a", "2 b", "3 c", "4 d"]);
    expect(content.moreCount).toBe(2);
  });
});
