import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  showDelta?: boolean;
  formatFn?: (value: number) => string;
}

export function AnimatedCounter({
  value,
  duration = 500,
  className,
  prefix = "",
  suffix = "",
  showDelta = false,
  formatFn = (v) => v.toLocaleString("pt-BR"),
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [delta, setDelta] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const previousValue = useRef(value);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === previousValue.current) return;

    const startValue = previousValue.current;
    const endValue = value;
    const diff = endValue - startValue;
    const startTime = performance.now();

    // Show delta
    if (showDelta && diff !== 0) {
      setDelta(diff);
      setTimeout(() => setDelta(null), 2000);
    }

    setIsAnimating(true);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = Math.round(startValue + diff * easeOut);
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        setIsAnimating(false);
        previousValue.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, showDelta]);

  return (
    <span className={cn("relative inline-flex items-center gap-1", className)}>
      <span className={cn(isAnimating && "text-primary transition-colors")}>
        {prefix}
        {formatFn(displayValue)}
        {suffix}
      </span>
      
      {/* Delta indicator */}
      {delta !== null && (
        <span
          className={cn(
            "absolute -right-8 top-0 text-xs font-medium animate-bounce",
            delta > 0 ? "text-green-500" : "text-red-500"
          )}
          style={{
            animation: "fadeInUp 0.3s ease-out, fadeOut 1.5s ease-in 0.5s forwards",
          }}
        >
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}
    </span>
  );
}

// CSS for the animation (add to index.css if not present)
// @keyframes fadeInUp {
//   from { opacity: 0; transform: translateY(10px); }
//   to { opacity: 1; transform: translateY(0); }
// }
// @keyframes fadeOut {
//   to { opacity: 0; }
// }
