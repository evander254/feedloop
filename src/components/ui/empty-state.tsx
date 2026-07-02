import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "card-base flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-[var(--border-light)] text-[var(--text-tertiary)]">
        {icon}
      </span>
      <h3 className="text-base font-bold text-[var(--text-primary)]">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-xs text-sm text-[var(--text-tertiary)]">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
