import { Repeat2 } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" aria-label="턴">
      <span
        className={`${compact ? "size-9" : "size-11"} grid shrink-0 place-items-center rounded-[8px] bg-[#176047] text-white shadow-[0_5px_14px_rgba(23,96,71,0.2)]`}
      >
        <Repeat2 aria-hidden="true" className={compact ? "size-5" : "size-6"} strokeWidth={2.4} />
      </span>
      <span className={`${compact ? "text-xl" : "text-2xl"} font-black tracking-normal text-[#14231c]`}>
        턴
      </span>
    </div>
  );
}