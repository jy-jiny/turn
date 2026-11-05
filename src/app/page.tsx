import { Brand } from "@/components/brand";
import { CreateRoomForm } from "@/components/create-room-form";
import { RecentRooms } from "@/components/recent-rooms";
import { Plus, Repeat2 } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen px-5 pb-12 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex h-20 items-center justify-center sm:h-24">
          <Brand />
        </header>

        <section className="grid items-center gap-10 py-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:py-16">
          <div className="enter-up">
            <p className="mb-4 inline-flex rounded-full border border-[#F1E2D3] bg-white px-3 py-1 text-xs font-black text-[#8C6E5D] shadow-[0_2px_8px_rgba(120,70,40,0.06)]">
              오늘의 순서
            </p>
            <h1 className="max-w-lg text-4xl font-black leading-[1.18] text-[#3B2417] sm:text-6xl">
              누가 살지,
              <br />
              <span className="text-[#E8643D]">가볍게 정해요.</span>
            </h1>
            <p className="mt-5 max-w-md text-base font-medium leading-7 text-[#8C6E5D] sm:text-lg">
              함께할 사람을 추가하고 순서를 이어가세요.
            </p>

            <RecentRooms />

            <div className="mt-10 hidden max-w-sm lg:block" aria-hidden="true">
              <div className="flex items-center gap-4 rounded-[20px] border border-[#F1E2D3] bg-white p-4 shadow-sm">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#FFEDE3] text-[#E8643D]">
                  <Repeat2 className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-black text-[#5A3A28]">순서는 자동으로 이어져요</p>
                  <p className="mt-1 text-xs font-semibold text-[#9A7D6C]">산 사람은 대기열 맨 뒤로 이동</p>
                </div>
              </div>
            </div>
          </div>

          <div className="enter-up-delayed rounded-[20px] border border-[#F1E2D3] bg-white p-5 shadow-[0_24px_60px_rgba(120,70,40,0.10)] sm:p-8 lg:p-10">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black text-[#E8643D]">NEW ROOM</p>
                <h2 className="mt-2 text-2xl font-black text-[#3B2417] sm:text-3xl">방 만들기</h2>
              </div>
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#FFEDE3] text-[#E8643D]">
                <Plus className="size-5" aria-hidden="true" />
              </span>
            </div>
            <CreateRoomForm />
          </div>
        </section>
      </div>
    </main>
  );
}