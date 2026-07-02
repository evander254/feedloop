import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glass?: boolean;
  gradient?: boolean;
}

export function Card({ className, hover, glass, gradient, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "card-base",
        hover && "card-hover-lift",
        glass && "glass-panel",
        gradient && "gradient-border",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
