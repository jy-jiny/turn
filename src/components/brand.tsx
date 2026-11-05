import { Repeat2 } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" aria-label="턴">
      <span
        className={`${compact ? "size-9" : "size-11"} grid shrink-0 place-items-center rounded-[12px] bg-[#E8643D] text-white shadow-[0_6px_16px_rgba(232,100,61,0.28)]`}
      >
        <Repeat2 aria-hidden="true" className={compact ? "size-5" : "size-6"} strokeWidth={2.4} />
      </span>
      <span className={`${compact ? "text-xl" : "text-2xl"} font-black tracking-normal text-[#3B2417]`}>
        턴
      </span>
    </div>
  );
}