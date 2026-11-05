"use client";

import { ChevronRight, History, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { forgetRoom, loadRecentRooms, type RecentRoom } from "@/lib/recent-rooms";

/** Rooms this device has opened, so they can be found again without the link. */
export function RecentRooms() {
  const [rooms, setRooms] = useState<RecentRoom[]>([]);

  useEffect(() => {
    // Storage is only readable in the browser, so the list fills in after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRooms(loadRecentRooms());
  }, []);

  if (rooms.length === 0) return null;

  return (
    <section aria-labelledby="recent-rooms-title" className="mt-8 max-w-md">
      <h2 id="recent-rooms-title" className="mb-3 flex items-center gap-2 text-sm font-black text-[#34443c]">
        <History className="size-4 text-[#176047]" aria-hidden="true" />내 방
      </h2>
      <ul className="grid gap-2">
        {rooms.map((room) => (
          <li key={room.slug} className="relative">
            <Link
              href={`/r/${room.slug}`}
              className="flex h-14 items-center justify-between gap-3 rounded-[8px] border border-[#dbe3dd] bg-white pl-4 pr-12 font-black text-[#14231c] shadow-sm transition hover:border-[#a9c7ba] hover:bg-[#f7faf8] focus-visible:outline-4 focus-visible:outline-[#176047]/20"
            >
              <span className="truncate">{room.name}</span>
              <ChevronRight className="size-5 shrink-0 text-[#8a9890]" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => setRooms(forgetRoom(room.slug))}
              className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-[#8a9890] hover:bg-[#fbe9e4] hover:text-[#d64b38] focus-visible:outline-4 focus-visible:outline-[#ff6b4a]/20"
              aria-label={`${room.name} 목록에서 지우기`}
              title="목록에서 지우기"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs font-semibold text-[#8a9890]">이 기기에서 열었던 방만 보여요.</p>
    </section>
  );
}
