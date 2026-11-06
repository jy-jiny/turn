import type { Metadata } from "next";
import { headers } from "next/headers";
import { RoomDashboard } from "@/components/room-dashboard";
import { getRoomStore } from "@/lib/server/store";

type RoomPageProps = { params: Promise<{ slug: string }> };

const description = "오늘 살 사람과 다음 순서를 확인하세요.";

// Link previews (KakaoTalk, messages) read these tags, so a shared room link
// shows the room name and the app icon instead of a bare URL.
export async function generateMetadata({ params }: RoomPageProps): Promise<Metadata> {
  const { slug } = await params;
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "https";

  let roomName: string | null = null;
  try {
    roomName = (await getRoomStore().getRoom(slug)).name;
  } catch {
    // Unknown room or storage problem: fall back to the generic title.
  }

  const title = roomName ? `${roomName} · 턴` : "순서 · 턴";

  return {
    title,
    description,
    metadataBase: host ? new URL(`${protocol}://${host}`) : undefined,
    openGraph: {
      title,
      description,
      siteName: "턴",
      type: "website",
      images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "턴" }],
    },
  };
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { slug } = await params;
  return <RoomDashboard slug={slug} />;
}
