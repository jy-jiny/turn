export type QueueMember = {
  id: string;
  name: string;
  position: number;
};

export function moveBuyerToBack<T extends { id: string }>(queue: T[], buyerId: string): T[] {
  const buyer = queue.find((member) => member.id === buyerId);

  if (!buyer) {
    throw new Error("구매자를 대기열에서 찾을 수 없습니다.");
  }

  return [...queue.filter((member) => member.id !== buyerId), buyer];
}