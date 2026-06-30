import { cn } from "@/lib/utils";

type CardProps = React.HTMLAttributes<HTMLElement>;

export function Card({ className, children, ...props }: CardProps) {
  return (
    <section className={cn("glass-card rounded-3xl p-5", className)} {...props}>
      {children}
    </section>
  );
}
