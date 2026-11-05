import type { Metadata } from "next";
import { RoomDashboard } from "@/components/room-dashboard";

export const metadata: Metadata = {
  title: "순서 · 턴",
  description: "오늘 살 사람과 다음 순서를 확인하세요.",
};

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <RoomDashboard slug={slug} />;
}