import { Brand } from "@/components/brand";
import { CreateRoomForm } from "@/components/create-room-form";

export default function Home() {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <header className="flex items-center justify-between border-b-2 border-[#171714] pb-5">
          <Brand />
          <p className="text-sm font-black">오늘은 누구?</p>
        </header>

        <section className="py-12 sm:py-16">
          <div className="mb-9 flex items-end justify-between gap-6">
            <div>
              <p className="mb-3 text-xs font-black uppercase text-[#2457e6]">New coffee room</p>
              <h1 className="max-w-xl text-3xl font-black leading-tight sm:text-5xl">
                우리 셋의
                <br />
                커피방 만들기
              </h1>
            </div>
            <div className="hidden items-center gap-2 pb-1 sm:flex" aria-hidden="true">
              {["01", "02", "03"].map((number, index) => (
                <div key={number} className="flex items-center gap-2">
                  <span
                    className={`grid size-10 place-items-center text-xs font-black ${
                      index === 0 ? "bg-[#ffcc3d]" : "border-2 border-[#171714] bg-white"
                    }`}
                  >
                    {number}
                  </span>
                  {index < 2 && <span className="h-0.5 w-4 bg-[#171714]" />}
                </div>
              ))}
            </div>
          </div>

          <div className="border-2 border-[#171714] bg-[#f7f6f1] p-5 shadow-[8px_8px_0_#171714] sm:p-8">
            <CreateRoomForm />
          </div>
        </section>
      </div>
    </main>
  );
}