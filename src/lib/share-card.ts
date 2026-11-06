import { formatDateTime } from "./format-record-time";
import type { RoomState } from "@/lib/types";

/** Queue chips shown on the card before the rest collapse into "+N". */
export const MAX_CARD_CHIPS = 4;

export type ShareCardChip = { label: string; current: boolean };

export type ShareCardContent = {
  badge: string;
  subline: string;
  headline: string;
  chips: ShareCardChip[];
  moreCount: number;
  timeLabel: string;
  shareText: string;
};

/**
 * Decides what the KakaoTalk notice card says. The words change on every
 * purchase, so the card is drawn in the browser from this content; no image
 * generation is involved.
 */
export function buildShareCardContent(
  room: Pick<RoomState, "name" | "members" | "purchases">,
  now: Date,
  url: string,
): ShareCardContent {
  const next = room.members[0]?.name ?? "";
  const latest = room.purchases[0];

  return {
    badge: `${room.name} · 턴`,
    subline: latest ? `${latest.buyerName}님이 샀어요` : "오늘의 순서",
    headline: `${next}님 차례!`,
    chips: room.members.slice(0, MAX_CARD_CHIPS).map((member, index) => ({
      label: `${index + 1} ${member.name}`,
      current: index === 0,
    })),
    moreCount: Math.max(0, room.members.length - MAX_CARD_CHIPS),
    timeLabel: formatDateTime(latest ? new Date(latest.createdAt) : now),
    shareText: latest
      ? `${latest.buyerName}님이 샀어요. 다음은 ${next}님 차례예요! (${room.name})\n${url}`
      : `오늘은 ${next}님 차례예요! (${room.name})\n${url}`,
  };
}
