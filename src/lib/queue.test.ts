import { describe, expect, it } from "vitest";
import { moveBuyerToBack } from "./queue";

const queue = [
  { id: "minsu", name: "민수" },
  { id: "jisu", name: "지수" },
  { id: "chulsu", name: "철수" },
];

describe("moveBuyerToBack", () => {
  it("moves the expected buyer to the back", () => {
    expect(moveBuyerToBack(queue, "minsu").map(({ id }) => id)).toEqual([
      "jisu",
      "chulsu",
      "minsu",
    ]);
  });

  it("keeps everyone else's order when a substitute buys", () => {
    expect(moveBuyerToBack(queue, "chulsu").map(({ id }) => id)).toEqual([
      "minsu",
      "jisu",
      "chulsu",
    ]);
  });

  it("supports queues with more than three people", () => {
    const extendedQueue = [...queue, { id: "younghee", name: "영희" }];

    expect(moveBuyerToBack(extendedQueue, "jisu").map(({ id }) => id)).toEqual([
      "minsu",
      "chulsu",
      "younghee",
      "jisu",
    ]);
  });

  it("rejects a buyer outside the queue", () => {
    expect(() => moveBuyerToBack(queue, "unknown")).toThrow(
      "구매자를 대기열에서 찾을 수 없습니다.",
    );
  });
});