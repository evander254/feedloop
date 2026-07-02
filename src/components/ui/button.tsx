import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading,
  icon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: "min-h-9 gap-1.5 rounded-xl px-4 text-xs",
    md: "min-h-11 gap-2 rounded-xl px-5 text-sm",
    lg: "min-h-12 gap-2.5 rounded-2xl px-6 text-sm",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
        "disabled:pointer-events-none disabled:opacity-50",
        sizeClasses[size],
        variant === "primary" &&
          "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.97]",
        variant === "secondary" &&
          "border border-[var(--border-light)] bg-[var(--surface-card)] text-[var(--text-primary)] shadow-sm hover:bg-[var(--border-light)] hover:border-[var(--border-default)] active:scale-[0.97]",
        variant === "ghost" &&
          "text-[var(--text-secondary)] hover:bg-[var(--border-light)] hover:text-[var(--text-primary)] active:scale-[0.97]",
        variant === "danger" &&
          "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-md shadow-red-500/20 hover:from-red-400 hover:to-red-500 hover:shadow-lg hover:shadow-red-500/30 active:scale-[0.97]",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={size === "sm" ? 14 : 16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}
