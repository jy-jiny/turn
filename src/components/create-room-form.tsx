"use client";

import { ArrowRight, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { requestRoom } from "@/lib/client-api";
import { MAX_MEMBERS, MIN_MEMBERS } from "@/lib/types";

const initialMembers = ["", ""];

export function CreateRoomForm() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [members, setMembers] = useState(initialMembers);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function updateMember(index: number, value: string) {
    setMembers((current) => current.map((member, memberIndex) => (memberIndex === index ? value : member)));
  }

  function addMember() {
    setMembers((current) => (current.length < MAX_MEMBERS ? [...current, ""] : current));
  }

  function removeMember(index: number) {
    setMembers((current) =>
      current.length > MIN_MEMBERS ? current.filter((_, memberIndex) => memberIndex !== index) : current,
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        const room = await requestRoom("/api/rooms", {
          method: "POST",
          body: JSON.stringify({ name: roomName, memberNames: members }),
        });
        router.push(`/r/${room.slug}`);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "방을 만들지 못했습니다.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-6">
        <label className="grid gap-2">
          <span className="text-sm font-bold text-[#34443c]">방 이름</span>
          <input
            value={roomName}
            onChange={(event) => setRoomName(event.target.value)}
            maxLength={30}
            autoComplete="off"
            placeholder="예: 3층 점심 원정대"
            className="h-14 w-full rounded-[7px] border border-[#d5ded8] bg-[#f8faf8] px-4 text-base font-semibold text-[#14231c] outline-none transition focus:border-[#176047] focus:bg-white focus:ring-4 focus:ring-[#176047]/10 placeholder:font-normal placeholder:text-[#9aa49e]"
          />
        </label>

        <fieldset className="grid gap-3">
          <legend className="mb-2 flex w-full items-center justify-between text-sm font-bold text-[#34443c]">
            <span>함께하는 사람</span>
            <span className="text-xs text-[#718078]">{members.length}명</span>
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {members.map((member, index) => (
              <label key={index} className="relative block">
                <span className="absolute left-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-[#e5f2eb] text-xs font-black text-[#176047]">
                  {index + 1}
                </span>
                <span className="sr-only">{index + 1}번째 사람 이름</span>
                <input
                  value={member}
                  onChange={(event) => updateMember(index, event.target.value)}
                  maxLength={12}
                  autoComplete="off"
                  placeholder="이름 입력"
                  className="h-14 w-full rounded-[7px] border border-[#d5ded8] bg-[#f8faf8] pl-12 pr-12 font-bold text-[#14231c] outline-none transition focus:border-[#176047] focus:bg-white focus:ring-4 focus:ring-[#176047]/10 placeholder:font-normal placeholder:text-[#a4ada7]"
                />
                <button
                  type="button"
                  onClick={() => removeMember(index)}
                  disabled={members.length <= MIN_MEMBERS}
                  className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-[#8a9890] hover:bg-[#fbe9e4] hover:text-[#d64b38] focus-visible:outline-4 focus-visible:outline-[#ff6b4a]/20 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label={`${index + 1}번째 사람 삭제`}
                  title="사람 삭제"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={addMember}
            disabled={members.length >= MAX_MEMBERS}
            className="mt-1 flex h-11 items-center justify-center gap-2 rounded-[7px] border border-dashed border-[#a9c7ba] bg-[#f7faf8] text-sm font-black text-[#176047] hover:bg-[#e5f2eb] focus-visible:outline-4 focus-visible:outline-[#176047]/20 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Plus className="size-4" aria-hidden="true" />
            사람 추가
          </button>
        </fieldset>
      </div>

      <div aria-live="polite" className="min-h-10 pt-3">
        {error && <p className="text-sm font-bold text-[#d64b38]">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex h-16 w-full items-center justify-between rounded-[8px] bg-[#176047] px-5 text-lg font-black text-white shadow-[0_10px_24px_rgba(23,96,71,0.22)] transition hover:bg-[#0e4936] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#ff6b4a] active:translate-y-px disabled:cursor-wait disabled:opacity-70"
      >
        <span>{isPending ? "방 만드는 중" : "공유 방 만들기"}</span>
        {isPending ? (
          <LoaderCircle aria-hidden="true" className="size-6 animate-spin" />
        ) : (
          <span className="grid size-9 place-items-center rounded-full bg-white/15">
            <ArrowRight aria-hidden="true" className="size-5" strokeWidth={2.5} />
          </span>
        )}
      </button>
    </form>
  );
}