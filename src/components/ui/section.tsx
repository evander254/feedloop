import { cn } from "@/lib/utils";

interface SectionProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function Section({ title, description, actions, className, children }: SectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-0.5">
            {title && (
              <h2 className="text-base font-bold text-[var(--text-primary)]">{title}</h2>
            )}
            {description && (
              <p className="text-xs text-[var(--text-tertiary)]">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
