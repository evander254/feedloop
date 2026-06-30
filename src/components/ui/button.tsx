import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40",
        variant === "primary" && "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700",
        variant === "secondary" &&
          "border border-emerald-700/10 bg-white/70 text-slate-900 shadow-sm hover:bg-white dark:bg-white/10 dark:text-white dark:hover:bg-white/15",
        variant === "ghost" && "text-slate-700 hover:bg-emerald-500/10 dark:text-slate-200",
        className,
      )}
      {...props}
    />
  );
}
