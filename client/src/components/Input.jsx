import { cn } from "../lib/utils.js";

export function Input({ label, error, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[13px] font-medium text-ink">
          {label}
        </label>
      )}
      <input
        className={cn(
          "h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-[14px] text-ink placeholder:text-muted",
          "focus:outline-none focus:border-pine focus:ring-1 focus:ring-pine",
          "transition-colors duration-150",
          error && "border-clay focus:border-clay focus:ring-clay",
          className
        )}
        {...props}
      />
      {error && <p className="text-[12px] text-clay">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[13px] font-medium text-ink">{label}</label>}
      <textarea
        className={cn(
          "w-full rounded-[10px] border border-line bg-surface px-3 py-2 text-[14px] text-ink placeholder:text-muted resize-y min-h-[80px]",
          "focus:outline-none focus:border-pine focus:ring-1 focus:ring-pine",
          "transition-colors duration-150",
          error && "border-clay focus:border-clay focus:ring-clay",
          className
        )}
        {...props}
      />
      {error && <p className="text-[12px] text-clay">{error}</p>}
    </div>
  );
}
