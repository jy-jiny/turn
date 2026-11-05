"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { requestRoom } from "@/lib/client-api";

const initialMembers = ["", "", ""];

export function CreateRoomForm() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [members, setMembers] = useState(initialMembers);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function updateMember(index: number, value: string) {
    setMembers((current) => current.map((member, memberIndex) => (memberIndex === index ? value : member)));
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
            placeholder="예: 3층 커피 원정대"
            className="h-14 w-full rounded-[7px] border border-[#d5ded8] bg-[#f8faf8] px-4 text-base font-semibold text-[#14231c] outline-none transition focus:border-[#176047] focus:bg-white focus:ring-4 focus:ring-[#176047]/10 placeholder:font-normal placeholder:text-[#9aa49e]"
          />
        </label>

        <fieldset className="grid gap-3">
          <legend className="mb-2 text-sm font-bold text-[#34443c]">마시는 사람</legend>
          <div className="grid gap-3 sm:grid-cols-3">
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
                  placeholder={["민수", "지수", "철수"][index]}
                  className="h-14 w-full rounded-[7px] border border-[#d5ded8] bg-[#f8faf8] pl-12 pr-3 font-bold text-[#14231c] outline-none transition focus:border-[#176047] focus:bg-white focus:ring-4 focus:ring-[#176047]/10 placeholder:font-normal placeholder:text-[#a4ada7]"
                />
              </label>
            ))}
          </div>
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