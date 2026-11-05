"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronRight,
  Clipboard,
  House,
  LoaderCircle,
  Receipt,
  Plus,
  RotateCcw,
  Settings,
  Share2,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { Brand } from "@/components/brand";
import { requestRoom, RoomApiError } from "@/lib/client-api";
import { forgetRoom, rememberRoom } from "@/lib/recent-rooms";
import { MAX_MEMBERS, MIN_MEMBERS, type Member, type RoomState } from "@/lib/types";

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
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-[20px] border border-[#F1E2D3] bg-white p-0 text-[#3B2417] shadow-[0_24px_80px_rgba(59,36,23,0.24)] backdrop:bg-[#3B2417]/60"
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
      <div className="flex items-start justify-between border-b border-[#F3E6D9] p-5 sm:p-6">
        <div>
          <p className="text-xs font-black text-[#E8643D]">대타 기록</p>
          <h2 className="mt-1 text-2xl font-black">누가 샀나요?</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid size-10 place-items-center rounded-full bg-[#FFF3EA] text-[#7A5A48] hover:bg-[#FFEDE3] hover:text-[#E8643D] focus-visible:outline-4 focus-visible:outline-[#E8643D]/20"
          aria-label="닫기"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <div className="grid gap-2 p-5 sm:p-6">
        {room.members.map((member, index) => (
          <button
            type="button"
            key={member.id}
            disabled={isPending}
            onClick={() => onChoose(member.id)}
            className="group flex min-h-16 items-center justify-between rounded-[20px] border border-[#F1E2D3] bg-white px-4 text-left transition hover:border-[#F5BFA8] hover:bg-[#FFF6EF] focus-visible:outline-4 focus-visible:outline-[#E8643D]/20 disabled:opacity-60"
          >
            <span className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-full bg-[#FFEDE3] text-xs font-black text-[#E8643D] group-hover:bg-white">
                {index + 1}
              </span>
              <span>
                <strong className="block text-lg">{member.name}</strong>
                <small className="text-xs font-bold text-[#9A7D6C]">
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

  function addMember() {
    setMembers((current) =>
      current.length < MAX_MEMBERS
        ? [
            ...current,
            {
              id: crypto.randomUUID(),
              name: "",
              position: current.length,
            },
          ]
        : current,
    );
  }

  function removeMember(id: string) {
    setMembers((current) =>
      current.length > MIN_MEMBERS
        ? current
            .filter((member) => member.id !== id)
            .map((member, position) => ({ ...member, position }))
        : current,
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(name, members);
  }

  return (
    <Modal label="방 설정" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-start justify-between border-b border-[#F3E6D9] p-5 sm:p-6">
          <div>
            <p className="text-xs font-black text-[#E8643D]">방 설정</p>
            <h2 className="mt-1 text-2xl font-black">이름과 순서</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-full bg-[#FFF3EA] text-[#7A5A48] hover:bg-[#FFEDE3] hover:text-[#E8643D] focus-visible:outline-4 focus-visible:outline-[#E8643D]/20"
            aria-label="닫기"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 p-5">
          <label className="grid grid-cols-[minmax(0,1fr)] gap-2">
            <span className="text-sm font-black text-[#5A3A28]">방 이름</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={30}
              className="h-12 rounded-[14px] border border-[#EBD9C8] bg-[#FFF8F2] px-3 font-bold outline-none focus:border-[#E8643D] focus:bg-white focus:ring-4 focus:ring-[#E8643D]/10"
            />
          </label>

          <fieldset className="min-w-0">
            <legend className="mb-3 flex w-full items-center justify-between text-sm font-black text-[#5A3A28]">
              <span>현재 순서</span>
              <span className="text-xs text-[#9A7D6C]">{members.length}명</span>
            </legend>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
              {members.map((member, index) => (
                <div key={member.id} className="flex items-center gap-2">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#E8643D] text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <input
                    value={member.name}
                    onChange={(event) => updateMemberName(member.id, event.target.value)}
                    maxLength={12}
                    aria-label={`${index + 1}번째 사람 이름`}
                    className="h-12 w-0 min-w-0 flex-1 rounded-[14px] border border-[#EBD9C8] bg-[#FFF8F2] px-3 font-bold outline-none focus:border-[#E8643D] focus:bg-white focus:ring-4 focus:ring-[#E8643D]/10"
                  />
                  <div className="flex shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveMember(index, -1)}
                      className="grid size-10 place-items-center rounded-l-[14px] border border-[#EBD9C8] bg-white text-[#7A5A48] hover:bg-[#FFEDE3] hover:text-[#E8643D] disabled:opacity-25"
                      aria-label={`${member.name} 순서 위로`}
                    >
                      <ArrowUp className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={index === members.length - 1}
                      onClick={() => moveMember(index, 1)}
                      className="grid size-10 place-items-center rounded-r-[14px] border border-l-0 border-[#EBD9C8] bg-white text-[#7A5A48] hover:bg-[#FFEDE3] hover:text-[#E8643D] disabled:opacity-25"
                      aria-label={`${member.name} 순서 아래로`}
                    >
                      <ArrowDown className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={members.length <= MIN_MEMBERS}
                    onClick={() => removeMember(member.id)}
                    className="grid size-10 shrink-0 place-items-center rounded-[14px] text-[#B0968A] hover:bg-[#fbe9e4] hover:text-[#d64b38] disabled:cursor-not-allowed disabled:opacity-25"
                    aria-label={`${member.name || `${index + 1}번째 사람`} 삭제`}
                    title="사람 삭제"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addMember}
              disabled={members.length >= MAX_MEMBERS}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-[#F5BFA8] bg-[#FFF8F2] text-sm font-black text-[#E8643D] hover:bg-[#FFEDE3] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Plus className="size-4" aria-hidden="true" />
              사람 추가
            </button>
          </fieldset>
        </div>

        <div className="flex gap-3 border-t border-[#F3E6D9] p-5 sm:p-6">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-[20px] border border-[#EBD9C8] bg-white font-black text-[#7A5A48] hover:bg-[#FFF3EA]"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex h-12 flex-[1.5] items-center justify-center gap-2 rounded-[20px] bg-[#E8643D] font-black text-white hover:bg-[#D4532E] disabled:opacity-60"
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
        if (error instanceof RoomApiError && error.status === 404) {
          forgetRoom(slug);
        }
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
      ?.channel(`turn:${slug}`)
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
    if (room) rememberRoom({ slug: room.slug, name: room.name });
  }, [room?.slug, room?.name]); // eslint-disable-line react-hooks/exhaustive-deps

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
          title: `${room.name} · 턴`,
          text: "오늘 살 사람을 확인해 보세요.",
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
        <div className="flex items-center gap-3 font-black text-[#5A3A28]">
          <LoaderCircle className="size-6 animate-spin text-[#E8643D]" aria-hidden="true" />
          순서를 불러오는 중
        </div>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <section className="w-full max-w-md rounded-[20px] border border-[#F1E2D3] bg-white p-7 shadow-[0_24px_60px_rgba(120,70,40,0.12)]">
          <span className="mb-5 grid size-12 place-items-center rounded-full bg-[#FFEDE3] text-[#E8643D]">
            <Receipt className="size-6" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-black">방을 열 수 없어요</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#8C6E5D]">{loadError}</p>
          <Link
            href="/"
            className="mt-7 flex h-12 items-center justify-center gap-2 rounded-[20px] bg-[#E8643D] font-black text-white hover:bg-[#D4532E]"
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
      <header className="sticky top-0 z-40 bg-[#FFF8EF]/90 px-4 py-3 backdrop-blur sm:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Link
            href="/"
            className="flex h-11 w-fit items-center gap-2 rounded-full border border-[#F1E2D3] bg-white px-4 text-sm font-black text-[#5A3A28] shadow-[0_4px_14px_rgba(120,70,40,0.08)] transition hover:border-[#F5BFA8] hover:bg-[#FFEDE3] hover:text-[#E8643D] focus-visible:outline-4 focus-visible:outline-[#E8643D]/25"
          >
            <House className="size-[18px]" aria-hidden="true" />홈
          </Link>
          <Brand compact />
          <div className="flex items-center gap-2 justify-self-end">
            <button
              type="button"
              onClick={shareRoom}
              className="grid size-11 place-items-center rounded-full border border-[#F1E2D3] bg-white text-[#7A5A48] shadow-[0_4px_14px_rgba(120,70,40,0.08)] transition hover:border-[#F5BFA8] hover:bg-[#FFEDE3] hover:text-[#E8643D] focus-visible:outline-4 focus-visible:outline-[#E8643D]/20"
              aria-label="방 공유"
              title="방 공유"
            >
              <Share2 className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="grid size-11 place-items-center rounded-full border border-[#F1E2D3] bg-white text-[#7A5A48] shadow-[0_4px_14px_rgba(120,70,40,0.08)] transition hover:border-[#F5BFA8] hover:bg-[#FFEDE3] hover:text-[#E8643D] focus-visible:outline-4 focus-visible:outline-[#E8643D]/20"
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
          <div className="mb-5 flex items-center justify-between gap-4 rounded-[20px] border border-[#efdca8] bg-[#fff8df] px-4 py-3 text-xs font-bold text-[#6f5a1c]">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#f3c84b]" />
              로컬 미리보기 · 서버를 다시 켜면 이 방은 사라집니다.
            </span>
            <span className="hidden text-[#8a7540] sm:inline">서버 저장 연결 전</span>
          </div>
        )}

        <section className="enter-up grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="min-w-0 rounded-[28px] border border-[#F3E6D9] bg-white px-6 py-9 text-center shadow-[0_18px_50px_rgba(120,70,40,0.10)] sm:px-10 sm:py-12">
            <p className="break-all text-2xl font-black text-[#3B2417] sm:text-3xl">{room.name}</p>
            <p className="mt-6 text-sm font-bold text-[#9A7D6C]">오늘은</p>
            <h1 className="mt-1 break-all text-6xl font-black leading-tight text-[#3B2417] sm:text-7xl">{currentBuyer.name}</h1>
            <p className="mt-2 text-lg font-bold text-[#8C6E5D]">님이 살 차례예요.</p>

            <div className="mx-auto mt-9 grid max-w-md gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => recordPurchase(currentBuyer.id)}
                className="flex min-h-16 items-center justify-center gap-2 rounded-full bg-[#E8643D] px-6 text-lg font-black text-white shadow-[0_12px_28px_rgba(232,100,61,0.32)] transition hover:bg-[#D4532E] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#E8643D]/40 active:translate-y-px disabled:cursor-wait disabled:opacity-70"
              >
                <span>{isPending ? "기록 중" : "샀어요"}</span>
                {isPending ? (
                  <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="size-5" strokeWidth={3} aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setBuyerDialogOpen(true)}
                className="min-h-14 rounded-full border-2 border-[#F1E2D3] bg-white px-6 font-black text-[#5A3A28] transition hover:border-[#F5BFA8] hover:bg-[#FFF6EF] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#E8643D]/30 disabled:opacity-60"
              >
                다른 사람이 샀어요
              </button>
            </div>
          </div>

          <aside className="rounded-[28px] border border-[#F3E6D9] bg-white p-6 text-[#3B2417] shadow-[0_10px_30px_rgba(120,70,40,0.06)] lg:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black">다음 순서</h2>
              </div>
              <span className="grid size-10 place-items-center rounded-full bg-[#FFEDE3] text-[#E8643D]">
                <Users className="size-5" aria-hidden="true" />
              </span>
            </div>
            <ol className="mt-5 grid gap-2">
              {room.members.map((member, index) => (
                <li
                  key={member.id}
                  className={`flex min-h-12 items-center gap-3 rounded-[20px] px-3 ${
                    index === 0 ? "bg-[#FFEDE3]" : "bg-[#FFF8F2]"
                  }`}
                >
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-black ${
                      index === 0 ? "bg-[#E8643D] text-white" : "bg-white text-[#9A7D6C]"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-black">{member.name}</span>
                  {index < room.members.length - 1 && (
                    <ArrowRight className="size-4 text-[#CBB6A8]" aria-hidden="true" />
                  )}
                </li>
              ))}
            </ol>
            <div className="mt-6 border-t border-[#F3E6D9] pt-5 text-xs font-semibold leading-5 text-[#9A7D6C]">
              산 사람은 맨 뒤로 이동해요. 대타가 사도 나머지 순서는 그대로예요.
            </div>
          </aside>
        </section>

        <section className="enter-up-delayed mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="overflow-hidden rounded-[20px] border border-[#F1E2D3] bg-white shadow-[0_10px_30px_rgba(120,70,40,0.06)]">
            <div className="flex items-center justify-between border-b border-[#F3E6D9] px-5 py-5 sm:px-6">
              <div>
                <h2 className="text-lg font-black">최근 기록</h2>
              </div>
              {room.purchases.length > 0 && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={undoPurchase}
                  className="flex h-10 items-center gap-2 rounded-[20px] border border-[#EBD9C8] px-3 text-sm font-bold text-[#7A5A48] hover:border-[#F5BFA8] hover:bg-[#FFEDE3] hover:text-[#E8643D] disabled:opacity-50"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  마지막 취소
                </button>
              )}
            </div>

            {room.purchases.length === 0 ? (
              <div className="grid min-h-36 place-items-center p-6 text-center">
                <div>
                  <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#FFF3EA] text-[#B0968A]">
                    <Receipt className="size-6" aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-sm font-bold text-[#9A7D6C]">첫 기록을 기다리고 있어요.</p>
                </div>
              </div>
            ) : (
              <ol>
                {room.purchases.map((purchase, index) => (
                  <li
                    key={purchase.id}
                    className={`flex items-center justify-between gap-4 px-5 py-4 sm:px-6 ${
                      index < room.purchases.length - 1 ? "border-b border-[#F6ECE2]" : ""
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#FFEDE3] text-[#E8643D]">
                        <Receipt className="size-4" aria-hidden="true" />
                      </span>
                      <span className="truncate font-black">{purchase.buyerName}</span>
                    </span>
                    <time className="shrink-0 text-xs font-bold text-[#9A7D6C]" dateTime={purchase.createdAt}>
                      {formatPurchaseDate(purchase.createdAt)}
                    </time>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <aside className="rounded-[20px] border border-[#f0dfb8] bg-[#fff8e8] p-5 sm:p-6">
            <span className="grid size-11 place-items-center rounded-full bg-white text-[#b5781c] shadow-sm">
              <Share2 className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-5 text-lg font-black">같이 쓰는 방</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#796943]">
              이 링크를 함께하는 사람들에게 보내면 같은 순서를 볼 수 있어요.
            </p>
            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={shareRoom}
                className="flex h-11 items-center justify-between rounded-[20px] bg-[#E8643D] px-3 font-black text-white hover:bg-[#D4532E]"
              >
                공유하기 <Share2 className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="flex h-11 items-center justify-between rounded-[20px] border border-[#e3ce9f] bg-white px-3 font-black text-[#5e502f] hover:bg-[#fff2cd]"
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
          className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-[20px] bg-[#3B2417] px-4 py-3 text-center text-sm font-black text-white shadow-[0_12px_35px_rgba(59,36,23,0.28)]"
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