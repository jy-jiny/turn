import { Brand } from "@/components/brand";
import { CreateRoomForm } from "@/components/create-room-form";
import { ArrowDown, Coffee, UsersRound } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen px-5 pb-12 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex h-20 items-center justify-between sm:h-24">
          <Brand />
          <div className="flex items-center gap-2 text-sm font-bold text-[#66736c]">
            <UsersRound className="size-4 text-[#176047]" aria-hidden="true" />
            세 명의 커피 순서
          </div>
        </header>

        <section className="grid items-center gap-10 py-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:py-16">
          <div className="enter-up">
            <p className="mb-4 flex items-center gap-2 text-sm font-black text-[#176047]">
              <span className="h-0.5 w-7 bg-[#ff6b4a]" />
              오늘의 커피 순서
            </p>
            <h1 className="max-w-lg text-4xl font-black leading-[1.18] text-[#14231c] sm:text-6xl">
              누가 살지,
              <br />
              <span className="text-[#176047]">가볍게 정해요.</span>
            </h1>
            <p className="mt-5 max-w-md text-base font-medium leading-7 text-[#66736c] sm:text-lg">
              세 사람의 이름으로 시작하는 공평한 커피 대기열.
            </p>

            <div className="mt-10 hidden max-w-sm lg:block" aria-hidden="true">
              <div className="flex items-center justify-between text-xs font-bold text-[#849087]">
                <span>오늘</span>
                <span>다음</span>
                <span>그다음</span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                {["민수", "지수", "철수"].map((name, index) => (
                  <div key={name} className="contents">
                    <span
                      className={`grid h-14 flex-1 place-items-center rounded-[8px] text-sm font-black ${
                        index === 0 ? "bg-[#176047] text-white" : "bg-white text-[#536058] shadow-sm"
                      }`}
                    >
                      {index === 0 ? <Coffee className="size-5" /> : name}
                    </span>
                    {index < 2 && <ArrowDown className="size-4 -rotate-90 text-[#a9b2ac]" />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="enter-up-delayed rounded-[8px] border border-[#dbe3dd] bg-white p-5 shadow-[0_24px_60px_rgba(30,55,43,0.10)] sm:p-8 lg:p-10">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black text-[#ff6b4a]">NEW ROOM</p>
                <h2 className="mt-2 text-2xl font-black text-[#14231c] sm:text-3xl">커피방 만들기</h2>
              </div>
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e5f2eb] text-[#176047]">
                <Coffee className="size-5" aria-hidden="true" />
              </span>
            </div>
            <CreateRoomForm />
          </div>
        </section>
      </div>
    </main>
  );
}