"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronRight,
  Clipboard,
  Coffee,
  LoaderCircle,
  RotateCcw,
  Settings,
  Share2,
  Users,
  X,
} from "lucide-react";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { Brand } from "@/components/brand";
import { requestRoom, RoomApiError } from "@/lib/client-api";
import type { Member, RoomState } from "@/lib/types";

type RoomDashboardProps = {
  slug: string;
};

type ModalProps = {
  children: React.ReactNode;
  label: string;
  onClose: () => void;
};

function Modal({ children, label, onClose }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          event.currentTarget.close();
        }
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg border-2 border-[#171714] bg-[#f7f6f1] p-0 text-[#171714] shadow-[8px_8px_0_#171714] backdrop:bg-[#171714]/55"
    >
      {children}
    </dialog>
  );
}

function BuyerDialog({
  room,
  isPending,
  onChoose,
  onClose,
}: {
  room: RoomState;
  isPending: boolean;
  onChoose: (buyerId: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal label="실제 구매자 선택" onClose={onClose}>
      <div className="flex items-start justify-between border-b-2 border-[#171714] p-5">
        <div>
          <p className="text-xs font-black text-[#2457e6]">대타 기록</p>
          <h2 className="mt-1 text-2xl font-black">누가 샀나요?</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid size-10 place-items-center border-2 border-[#171714] bg-white hover:bg-[#ffcc3d] focus-visible:outline-4 focus-visible:outline-[#2457e6]"
          aria-label="닫기"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <div className="grid gap-3 p-5">
        {room.members.map((member, index) => (
          <button
            type="button"
            key={member.id}
            disabled={isPending}
            onClick={() => onChoose(member.id)}
            className="group flex min-h-16 items-center justify-between border-2 border-[#171714] bg-white px-4 text-left hover:bg-[#ffcc3d] focus-visible:outline-4 focus-visible:outline-[#2457e6] disabled:opacity-60"
          >
            <span className="flex items-center gap-3">
              <span className="grid size-8 place-items-center bg-[#e9e8e2] text-xs font-black group-hover:bg-white">
                {index + 1}
              </span>
              <span>
                <strong className="block text-lg">{member.name}</strong>
                <small className="text-xs font-bold text-[#64635d]">
                  {index === 0 ? "원래 오늘 순서" : "대신 구매"}
                </small>
              </span>
            </span>
            {isPending ? (
              <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <ChevronRight className="size-5" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
    </Modal>
  );
}

function SettingsDialog({
  room,
  isPending,
  onSave,
  onClose,
}: {
  room: RoomState;
  isPending: boolean;
  onSave: (name: string, members: Member[]) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(room.name);
  const [members, setMembers] = useState(room.members);

  function updateMemberName(id: string, memberName: string) {
    setMembers((current) =>
      current.map((member) => (member.id === id ? { ...member, name: memberName } : member)),
    );
  }

  function moveMember(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= members.length) return;

    setMembers((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((member, position) => ({ ...member, position }));
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(name, members);
  }

  return (
    <Modal label="방 설정" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-start justify-between border-b-2 border-[#171714] p-5">
          <div>
            <p className="text-xs font-black text-[#2457e6]">방 설정</p>
            <h2 className="mt-1 text-2xl font-black">이름과 순서</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center border-2 border-[#171714] bg-white hover:bg-[#ffcc3d] focus-visible:outline-4 focus-visible:outline-[#2457e6]"
            aria-label="닫기"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-6 p-5">
          <label className="grid gap-2">
            <span className="text-sm font-black">방 이름</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={30}
              className="h-12 border-2 border-[#171714] bg-white px-3 font-bold outline-none focus:shadow-[4px_4px_0_#ffcc3d]"
            />
          </label>

          <fieldset>
            <legend className="mb-3 text-sm font-black">현재 순서</legend>
            <div className="grid gap-3">
              {members.map((member, index) => (
                <div key={member.id} className="flex items-center gap-2">
                  <span className="grid size-10 shrink-0 place-items-center bg-[#171714] text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <input
                    value={member.name}
                    onChange={(event) => updateMemberName(member.id, event.target.value)}
                    maxLength={12}
                    aria-label={`${index + 1}번째 사람 이름`}
                    className="h-12 min-w-0 flex-1 border-2 border-[#171714] bg-white px-3 font-bold outline-none focus:shadow-[4px_4px_0_#ffcc3d]"
                  />
                  <div className="flex shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveMember(index, -1)}
                      className="grid size-10 place-items-center border-2 border-r-0 border-[#171714] bg-white hover:bg-[#ffcc3d] disabled:opacity-25"
                      aria-label={`${member.name} 순서 위로`}
                    >
                      <ArrowUp className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={index === members.length - 1}
                      onClick={() => moveMember(index, 1)}
                      className="grid size-10 place-items-center border-2 border-[#171714] bg-white hover:bg-[#ffcc3d] disabled:opacity-25"
                      aria-label={`${member.name} 순서 아래로`}
                    >
                      <ArrowDown className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="flex gap-3 border-t-2 border-[#171714] p-5">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 border-2 border-[#171714] bg-white font-black hover:bg-[#e9e8e2]"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex h-12 flex-[1.5] items-center justify-center gap-2 bg-[#2457e6] font-black text-white disabled:opacity-60"
          >
            {isPending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
            저장하기
          </button>
        </div>
      </form>
    </Modal>
  );
}

function formatPurchaseDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  return new Intl.DateTimeFormat("ko-KR", {
    ...(isToday ? {} : { month: "short", day: "numeric" }),
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function RoomDashboard({ slug }: RoomDashboardProps) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [buyerDialogOpen, setBuyerDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    let active = true;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    async function refresh() {
      try {
        const nextRoom = await requestRoom(`/api/rooms/${slug}`, { cache: "no-store" });
        if (active) {
          setRoom(nextRoom);
          setLoadError("");
        }
      } catch (error) {
        if (active && !room) {
          setLoadError(error instanceof Error ? error.message : "방을 불러오지 못했습니다.");
        }
      }
    }

    void refresh();
    const interval = window.setInterval(refresh, 5000);
    const realtimeClient =
      supabaseUrl && supabaseAnonKey
        ? createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : null;
    const channel = realtimeClient
      ?.channel(`coffee-turn:${slug}`)
      .on("broadcast", { event: "room-updated" }, () => void refresh())
      .subscribe();
    realtimeChannelRef.current = channel ?? null;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (realtimeClient && channel) {
        void realtimeClient.removeChannel(channel);
      }
      if (realtimeChannelRef.current === channel) {
        realtimeChannelRef.current = null;
      }
    };
    // The room is refreshed by slug; local room changes should not restart polling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function broadcastUpdate(version: number) {
    void realtimeChannelRef.current?.send({
      type: "broadcast",
      event: "room-updated",
      payload: { version },
    });
  }

  async function refreshAfterConflict(error: unknown) {
    if (error instanceof RoomApiError && error.status === 409) {
      const latest = await requestRoom(`/api/rooms/${slug}`, { cache: "no-store" });
      setRoom(latest);
    }
  }

  function recordPurchase(buyerId: string) {
    if (!room) return;
    const buyer = room.members.find((member) => member.id === buyerId);
    setNotice("");

    startTransition(async () => {
      try {
        const nextRoom = await requestRoom(`/api/rooms/${slug}/purchases`, {
          method: "POST",
          body: JSON.stringify({ buyerId, expectedVersion: room.version }),
        });
        setRoom(nextRoom);
        broadcastUpdate(nextRoom.version);
        setBuyerDialogOpen(false);
        setNotice(`${buyer?.name ?? "구매"} 기록을 남겼어요.`);
      } catch (error) {
        await refreshAfterConflict(error);
        setNotice(error instanceof Error ? error.message : "기록하지 못했습니다.");
      }
    });
  }

  function undoPurchase() {
    if (!room?.purchases.length) return;
    const latestBuyer = room.purchases[0].buyerName;

    startTransition(async () => {
      try {
        const nextRoom = await requestRoom(`/api/rooms/${slug}/purchases`, {
          method: "DELETE",
          body: JSON.stringify({ expectedVersion: room.version }),
        });
        setRoom(nextRoom);
        broadcastUpdate(nextRoom.version);
        setNotice(`${latestBuyer}님의 마지막 기록을 취소했어요.`);
      } catch (error) {
        await refreshAfterConflict(error);
        setNotice(error instanceof Error ? error.message : "취소하지 못했습니다.");
      }
    });
  }

  function saveSettings(name: string, members: Member[]) {
    if (!room) return;

    startTransition(async () => {
      try {
        const nextRoom = await requestRoom(`/api/rooms/${slug}`, {
          method: "PATCH",
          body: JSON.stringify({ name, members, expectedVersion: room.version }),
        });
        setRoom(nextRoom);
        broadcastUpdate(nextRoom.version);
        setSettingsOpen(false);
        setNotice("방 설정을 저장했어요.");
      } catch (error) {
        await refreshAfterConflict(error);
        setNotice(error instanceof Error ? error.message : "설정을 저장하지 못했습니다.");
      }
    });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotice("방 링크를 복사했어요.");
    } catch {
      setNotice("주소창의 링크를 복사해 주세요.");
    }
  }

  async function shareRoom() {
    if (!room) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${room.name} · 커피턴`,
          text: "오늘 커피 살 사람을 확인해 보세요.",
          url: window.location.href,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    await copyLink();
  }

  if (!room && !loadError) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="flex items-center gap-3 font-black">
          <LoaderCircle className="size-6 animate-spin text-[#2457e6]" aria-hidden="true" />
          커피 순서를 불러오는 중
        </div>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <section className="w-full max-w-md border-2 border-[#171714] bg-white p-7 shadow-[8px_8px_0_#171714]">
          <Coffee className="mb-5 size-10 text-[#2457e6]" aria-hidden="true" />
          <h1 className="text-2xl font-black">방을 열 수 없어요</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#64635d]">{loadError}</p>
          <Link
            href="/"
            className="mt-7 flex h-12 items-center justify-center gap-2 bg-[#171714] font-black text-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />새 방 만들기
          </Link>
        </section>
      </main>
    );
  }

  const currentBuyer = room.members[0];

  return (
    <main className="min-h-screen pb-12">
      <header className="border-b-2 border-[#171714] bg-[#f7f6f1]/95 px-5 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" aria-label="커피턴 새 방 만들기">
            <Brand compact />
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={shareRoom}
              className="grid size-10 place-items-center border-2 border-[#171714] bg-white hover:bg-[#ffcc3d] focus-visible:outline-4 focus-visible:outline-[#2457e6]"
              aria-label="방 공유"
              title="방 공유"
            >
              <Share2 className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="grid size-10 place-items-center border-2 border-[#171714] bg-white hover:bg-[#ffcc3d] focus-visible:outline-4 focus-visible:outline-[#2457e6]"
              aria-label="방 설정"
              title="방 설정"
            >
              <Settings className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pt-5 sm:px-8 sm:pt-8">
        {room.storageMode === "development-memory" && (
          <div className="mb-5 flex items-center justify-between gap-4 border-2 border-[#171714] bg-[#ffefb6] px-4 py-3 text-xs font-bold">
            <span>로컬 미리보기 · 서버를 다시 켜면 이 방은 사라집니다.</span>
            <span className="hidden text-[#64635d] sm:inline">Supabase 연결 전</span>
          </div>
        )}

        <section className="grid border-2 border-[#171714] bg-[#2457e6] text-white lg:grid-cols-[1fr_20rem]">
          <div className="min-w-0 p-6 sm:p-10 lg:p-12">
            <div className="flex items-center gap-2 text-sm font-black">
              <span className="size-2.5 bg-[#ffcc3d]" />
              {room.name}
            </div>
            <p className="mt-12 text-sm font-bold text-white/75 sm:mt-16">오늘 커피는</p>
            <h1 className="mt-2 break-all text-5xl font-black leading-tight sm:text-7xl">{currentBuyer.name}</h1>
            <p className="mt-3 text-lg font-bold">님이 살 차례예요.</p>

            <div className="mt-12 grid gap-3 sm:mt-14 sm:grid-cols-[minmax(0,1fr)_auto]">
              <button
                type="button"
                disabled={isPending}
                onClick={() => recordPurchase(currentBuyer.id)}
                className="flex min-h-16 items-center justify-between bg-[#ffcc3d] px-5 text-lg font-black text-[#171714] transition-transform hover:-translate-y-0.5 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-70"
              >
                <span>{isPending ? "기록 중" : "샀어요"}</span>
                {isPending ? (
                  <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="size-6" strokeWidth={3} aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setBuyerDialogOpen(true)}
                className="min-h-14 border-2 border-white px-5 font-black hover:bg-white hover:text-[#2457e6] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#ffcc3d] disabled:opacity-60 sm:min-h-16"
              >
                다른 사람이 샀어요
              </button>
            </div>
          </div>

          <aside className="border-t-2 border-[#171714] bg-[#f7f6f1] p-6 text-[#171714] lg:border-l-2 lg:border-t-0 lg:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black">다음 순서</h2>
              <Users className="size-5 text-[#2457e6]" aria-hidden="true" />
            </div>
            <ol className="mt-6 grid gap-3">
              {room.members.map((member, index) => (
                <li key={member.id} className="flex items-center gap-3">
                  <span
                    className={`grid size-10 shrink-0 place-items-center border-2 border-[#171714] text-xs font-black ${
                      index === 0 ? "bg-[#ffcc3d]" : "bg-white"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-black">{member.name}</span>
                  {index < room.members.length - 1 && (
                    <ArrowRight className="size-4 text-[#8a8982]" aria-hidden="true" />
                  )}
                </li>
              ))}
            </ol>
            <div className="mt-7 border-t-2 border-[#171714] pt-5 text-xs font-bold leading-5 text-[#64635d]">
              산 사람은 맨 뒤로 이동해요. 대타가 사도 나머지 순서는 그대로예요.
            </div>
          </aside>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="border-2 border-[#171714] bg-white">
            <div className="flex items-center justify-between border-b-2 border-[#171714] px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-black text-[#2457e6]">RECENT</p>
                <h2 className="mt-1 text-xl font-black">최근 구매</h2>
              </div>
              {room.purchases.length > 0 && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={undoPurchase}
                  className="flex h-10 items-center gap-2 border-2 border-[#171714] px-3 text-sm font-black hover:bg-[#ffcc3d] disabled:opacity-50"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  마지막 취소
                </button>
              )}
            </div>

            {room.purchases.length === 0 ? (
              <div className="grid min-h-36 place-items-center p-6 text-center">
                <div>
                  <Coffee className="mx-auto size-7 text-[#aaa9a2]" aria-hidden="true" />
                  <p className="mt-3 text-sm font-bold text-[#64635d]">첫 커피를 기다리고 있어요.</p>
                </div>
              </div>
            ) : (
              <ol>
                {room.purchases.map((purchase, index) => (
                  <li
                    key={purchase.id}
                    className={`flex items-center justify-between gap-4 px-5 py-4 sm:px-6 ${
                      index < room.purchases.length - 1 ? "border-b border-[#d7d6cf]" : ""
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center bg-[#e9e8e2]">
                        <Coffee className="size-4" aria-hidden="true" />
                      </span>
                      <span className="truncate font-black">{purchase.buyerName}</span>
                    </span>
                    <time className="shrink-0 text-xs font-bold text-[#64635d]" dateTime={purchase.createdAt}>
                      {formatPurchaseDate(purchase.createdAt)}
                    </time>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <aside className="border-2 border-[#171714] bg-[#f7f6f1] p-5 sm:p-6">
            <Share2 className="size-7 text-[#2457e6]" aria-hidden="true" />
            <h2 className="mt-5 text-lg font-black">같이 쓰는 방</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#64635d]">
              이 링크를 세 사람에게 보내면 같은 순서를 볼 수 있어요.
            </p>
            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={shareRoom}
                className="flex h-11 items-center justify-between bg-[#171714] px-3 font-black text-white"
              >
                공유하기 <Share2 className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="flex h-11 items-center justify-between border-2 border-[#171714] bg-white px-3 font-black hover:bg-[#ffcc3d]"
              >
                링크 복사 <Clipboard className="size-4" aria-hidden="true" />
              </button>
            </div>
          </aside>
        </section>
      </div>

      {notice && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 border-2 border-[#171714] bg-[#171714] px-4 py-3 text-center text-sm font-black text-white shadow-[5px_5px_0_#ffcc3d]"
        >
          {notice}
        </div>
      )}

      {buyerDialogOpen && (
        <BuyerDialog
          room={room}
          isPending={isPending}
          onChoose={recordPurchase}
          onClose={() => setBuyerDialogOpen(false)}
        />
      )}
      {settingsOpen && (
        <SettingsDialog
          room={room}
          isPending={isPending}
          onSave={saveSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </main>
  );
}