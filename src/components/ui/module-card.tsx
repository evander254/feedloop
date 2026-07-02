import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ModuleCardProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  count?: number;
  color?: "emerald" | "indigo" | "orange" | "purple";
  onClick?: () => void;
  className?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}

const colorMap = {
  emerald: { from: "from-emerald-500", to: "to-emerald-600", light: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  indigo: { from: "from-indigo-500", to: "to-indigo-600", light: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  orange: { from: "from-orange-500", to: "to-orange-600", light: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  purple: { from: "from-purple-500", to: "to-purple-600", light: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
};

export function ModuleCard({
  icon,
  label,
  description,
  count,
  color = "emerald",
  onClick,
  className,
  badge,
  children,
}: ModuleCardProps) {
  const c = colorMap[color];

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "card-base card-hover-lift relative flex w-full flex-col items-center gap-3 p-6 text-center",
        "cursor-pointer text-left",
        className,
      )}
    >
      <span className={cn("flex size-12 items-center justify-center rounded-2xl", c.light)}>
        {icon}
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
        {description && (
          <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">{description}</p>
        )}
      </div>
      {badge && <div className="mt-1">{badge}</div>}
      {count !== undefined && (
        <p className="text-2xl font-bold text-[var(--text-primary)]">{count}</p>
      )}
      {children}
    </motion.button>
  );
}
