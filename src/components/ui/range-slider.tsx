import { useRef, useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface RangeSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
  showTicks?: boolean;
  formatValue?: (value: number) => string;
}

export function RangeSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  className,
  showTicks = true,
  formatValue = (v) => String(v),
}: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState(false);
  const [focused, setFocused] = useState(false);

  const pct = ((value - min) / (max - min)) * 100;

  const computeValue = useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return value;
      const raw = ((clientX - rect.left) / rect.width) * (max - min) + min;
      const clamped = Math.min(max, Math.max(min, raw));
      const stepped = Math.round((clamped - min) / step) * step + min;
      return Math.round(stepped * 100) / 100;
    },
    [min, max, step, value],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(true);
      onChange(computeValue(e.clientX));
    },
    [computeValue, onChange],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      onChange(computeValue(e.clientX));
    },
    [dragging, computeValue, onChange],
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let next = value;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        next = Math.min(max, value + step);
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        next = Math.max(min, value - step);
      }
      if (e.key === "Home") {
        e.preventDefault();
        next = min;
      }
      if (e.key === "End") {
        e.preventDefault();
        next = max;
      }
      onChange(Math.round(next * 100) / 100);
    },
    [value, min, max, step, onChange],
  );

  const ticks = [0, 25, 50, 75, 100];

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-300">
          <span>{label}</span>
          <span className="font-mono text-xs tabular-nums text-slate-400 dark:text-slate-500">
            {formatValue(value)}
          </span>
        </label>
      )}

      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={label ?? "Range slider"}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={cn(
          "relative h-7 w-full touch-none select-none",
          "focus-visible:outline-none",
        )}
      >
        {/* Track background */}
        <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-200 dark:bg-slate-700">
          {/* Filled track */}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-75 ease-out"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #10b981, #14b8a6)",
              boxShadow: dragging || hover
                ? "0 0 12px rgba(16, 185, 129, 0.35), 0 0 4px rgba(16, 185, 129, 0.2)"
                : "0 0 6px rgba(16, 185, 129, 0.15)",
            }}
          />
        </div>

        {/* Thumb */}
        <div
          className={cn(
            "absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-transform duration-150 ease-out",
            (dragging || hover) && "scale-110",
          )}
          style={{ left: `${pct}%` }}
        >
          {/* Donut ring */}
          <div
            className={cn(
              "rounded-full border-2 bg-white transition-all duration-150 ease-out dark:bg-slate-900",
              focused && "ring-2 ring-emerald-500/30",
              dragging
                ? "size-5 border-emerald-500 shadow-lg shadow-emerald-500/25"
                : hover
                  ? "size-5 border-emerald-400 shadow-md"
                  : "size-[18px] border-emerald-300 shadow-sm dark:border-emerald-600",
            )}
          />

          {/* Fluid bubble tooltip */}
          <div
            className={cn(
              "absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg text-xs font-bold text-white transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none",
              dragging || hover || focused
                ? "scale-100 opacity-100"
                : "scale-50 opacity-0",
            )}
            style={{
              background: "linear-gradient(135deg, #10b981, #14b8a6)",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
            }}
          >
            {/* Arrow */}
            <div
              className="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45"
              style={{ background: "#14b8a6" }}
            />
            {formatValue(value)}
          </div>
        </div>
      </div>

      {/* Tick marks */}
      {showTicks && (
        <div className="relative mt-1.5">
          <div className="flex justify-between px-0">
            {ticks.map((t) => {
              const val = min + (t / 100) * (max - min);
              const isActive = pct >= t;
              return (
                <div key={t} className="flex flex-col items-center">
                  <div
                    className={cn(
                      "mb-0.5 h-1.5 w-px rounded-full transition-colors duration-200",
                      isActive ? "bg-emerald-400 dark:bg-emerald-500" : "bg-slate-300 dark:bg-slate-600",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-medium tabular-nums transition-colors duration-200",
                      isActive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-400 dark:text-slate-500",
                    )}
                  >
                    {formatValue(val)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
