import type { Metadata } from "next";
import { RoomDashboard } from "@/components/room-dashboard";

export const metadata: Metadata = {
  title: "커피 순서 · 커피턴",
  description: "오늘 커피를 살 사람과 다음 순서를 확인하세요.",
};

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <RoomDashboard slug={slug} />;
}