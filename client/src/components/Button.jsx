import { cn } from "../lib/utils.js";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  type = "button",
  onClick,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-sans font-medium transition-colors duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-pine focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-[10px]";

  const variants = {
    primary: "bg-pine text-white hover:bg-pine-hover active:bg-pine-hover border border-pine hover:border-pine-hover",
    secondary: "bg-transparent text-pine border border-pine hover:bg-pine-tint",
    ghost: "bg-transparent text-ink hover:bg-sunken border border-transparent",
    danger: "bg-clay text-white hover:bg-[#a04427] border border-clay",
    outline: "bg-transparent text-ink border border-line hover:bg-sunken",
  };

  const sizes = {
    sm: "h-8 px-3 text-[13px]",
    md: "h-10 px-4 text-[14px]",
    lg: "h-12 px-6 text-[15px]",
  };

  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
