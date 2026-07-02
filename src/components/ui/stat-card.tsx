import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: number;
  icon?: React.ReactNode;
  color?: "emerald" | "indigo" | "orange" | "purple";
  className?: string;
  children?: React.ReactNode;
}

const colorMap = {
  emerald: {
    bg: "from-emerald-500/10 to-emerald-500/5",
    icon: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/10",
    trendUp: "text-emerald-600 dark:text-emerald-400",
    trendDown: "text-red-500",
  },
  indigo: {
    bg: "from-indigo-500/10 to-indigo-500/5",
    icon: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
    ring: "ring-indigo-500/10",
    trendUp: "text-indigo-600 dark:text-indigo-400",
    trendDown: "text-red-500",
  },
  orange: {
    bg: "from-orange-500/10 to-orange-500/5",
    icon: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
    ring: "ring-orange-500/10",
    trendUp: "text-orange-600 dark:text-orange-400",
    trendDown: "text-red-500",
  },
  purple: {
    bg: "from-purple-500/10 to-purple-500/5",
    icon: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
    ring: "ring-purple-500/10",
    trendUp: "text-purple-600 dark:text-purple-400",
    trendDown: "text-red-500",
  },
};

export function StatCard({
  label,
  value,
  trend,
  icon,
  color = "emerald",
  className,
  children,
}: StatCardProps) {
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "card-base card-hover-lift relative overflow-hidden p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {value}
          </p>
          {trend !== undefined && (
            <p
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold",
                trend >= 0 ? c.trendUp : "text-red-500",
              )}
            >
              {trend >= 0 ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
              )}
              {Math.abs(trend)}%
            </p>
          )}
        </div>
        {icon && (
          <span className={cn("flex size-10 items-center justify-center rounded-xl", c.icon)}>
            {icon}
          </span>
        )}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </motion.div>
  );
}
