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
          <span className="text-sm font-bold text-[#5A3A28]">방 이름</span>
          <input
            value={roomName}
            onChange={(event) => setRoomName(event.target.value)}
            maxLength={30}
            autoComplete="off"
            placeholder="예: 3층 점심 원정대"
            className="h-14 w-full rounded-[14px] border border-[#EBD9C8] bg-[#FFF8F2] px-4 text-base font-semibold text-[#3B2417] outline-none transition focus:border-[#E8643D] focus:bg-white focus:ring-4 focus:ring-[#E8643D]/10 placeholder:font-normal placeholder:text-[#C2AA9C]"
          />
        </label>

        <fieldset className="grid gap-3">
          <legend className="mb-2 flex w-full items-center justify-between text-sm font-bold text-[#5A3A28]">
            <span>함께하는 사람</span>
            <span className="text-xs text-[#9A7D6C]">{members.length}명</span>
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {members.map((member, index) => (
              <label key={index} className="relative block">
                <span className="absolute left-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-[#FFEDE3] text-xs font-black text-[#E8643D]">
                  {index + 1}
                </span>
                <span className="sr-only">{index + 1}번째 사람 이름</span>
                <input
                  value={member}
                  onChange={(event) => updateMember(index, event.target.value)}
                  maxLength={12}
                  autoComplete="off"
                  placeholder="이름 입력"
                  className="h-14 w-full rounded-[14px] border border-[#EBD9C8] bg-[#FFF8F2] pl-12 pr-12 font-bold text-[#3B2417] outline-none transition focus:border-[#E8643D] focus:bg-white focus:ring-4 focus:ring-[#E8643D]/10 placeholder:font-normal placeholder:text-[#C2AA9C]"
                />
                <button
                  type="button"
                  onClick={() => removeMember(index)}
                  disabled={members.length <= MIN_MEMBERS}
                  className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-[#B0968A] hover:bg-[#fbe9e4] hover:text-[#d64b38] focus-visible:outline-4 focus-visible:outline-[#E8643D]/20 disabled:cursor-not-allowed disabled:opacity-30"
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
            className="mt-1 flex h-12 items-center justify-center gap-2 rounded-full border border-dashed border-[#F5BFA8] bg-[#FFF8F2] text-sm font-black text-[#E8643D] hover:bg-[#FFEDE3] focus-visible:outline-4 focus-visible:outline-[#E8643D]/20 disabled:cursor-not-allowed disabled:opacity-45"
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
        className="flex h-16 w-full items-center justify-center gap-3 rounded-full bg-[#E8643D] px-6 text-lg font-black text-white shadow-[0_10px_24px_rgba(232,100,61,0.22)] transition hover:bg-[#D4532E] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#E8643D] active:translate-y-px disabled:cursor-wait disabled:opacity-70"
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