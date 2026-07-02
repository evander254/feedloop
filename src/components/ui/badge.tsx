import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "emerald" | "indigo" | "orange" | "purple" | "slate" | "amber" | "red";
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const badgeVariants = {
  emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/15",
  indigo: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/15",
  orange: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/15",
  purple: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/15",
  slate: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/15",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/15",
  red: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/15",
};

const dotColors = {
  emerald: "bg-emerald-500",
  indigo: "bg-indigo-500",
  orange: "bg-orange-500",
  purple: "bg-purple-500",
  slate: "bg-slate-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};

export function Badge({ variant = "emerald", children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        badgeVariants[variant],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dotColors[variant])} />}
      {children}
    </span>
  );
}
