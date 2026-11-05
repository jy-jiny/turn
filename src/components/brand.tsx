import { Coffee } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" aria-label="커피턴">
      <span
        className={`${compact ? "size-9" : "size-11"} grid shrink-0 place-items-center bg-[#171714] text-[#ffcc3d]`}
      >
        <Coffee aria-hidden="true" className={compact ? "size-5" : "size-6"} strokeWidth={2.4} />
      </span>
      <span className={`${compact ? "text-xl" : "text-2xl"} font-black tracking-normal`}>커피턴</span>
    </div>
  );
}