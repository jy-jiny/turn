import { describe, expect, it } from "vitest";
import { formatDateTime, formatRecordTime } from "./format-record-time";

// Dates are built from local parts so the test does not depend on the machine's time zone.
const now = new Date(2026, 10, 6, 9, 30);

describe("formatRecordTime", () => {
  it("marks today's records with 오늘", () => {
    expect(formatRecordTime(new Date(2026, 10, 6, 14, 35), now)).toBe("오늘 오후 2:35");
    expect(formatRecordTime(new Date(2026, 10, 6, 0, 5), now)).toBe("오늘 오전 12:05");
  });

  it("marks yesterday's records with 어제", () => {
    expect(formatRecordTime(new Date(2026, 10, 5, 12, 0), now)).toBe("어제 오후 12:00");
  });

  it("shows month and day for older records this year", () => {
    expect(formatRecordTime(new Date(2026, 10, 3, 9, 5), now)).toBe("11월 3일 오전 9:05");
  });

  it("handles yesterday across a month boundary", () => {
    expect(formatRecordTime(new Date(2026, 9, 31, 18, 0), new Date(2026, 10, 1, 8, 0))).toBe("어제 오후 6:00");
  });

  it("formats an absolute date for share cards", () => {
    expect(formatDateTime(new Date(2026, 10, 6, 14, 33))).toBe("11월 6일 오후 2:33");
  });

  it("adds the year for records from another year", () => {
    expect(formatRecordTime(new Date(2025, 11, 31, 23, 59), now)).toBe("2025년 12월 31일 오후 11:59");
  });
});
