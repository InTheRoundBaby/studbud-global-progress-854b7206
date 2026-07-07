import { motion } from "motion/react";
import { useI18n } from "@/lib/i18n";
import { localizeNumber } from "@/lib/calendar";

export function ProgressRing({
  pct,
  size = 64,
  stroke = 6,
  showLabel = true,
}: {
  pct: number;
  size?: number;
  stroke?: number;
  showLabel?: boolean;
}) {
  const { language } = useI18n();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, pct));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} dir="ltr">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-secondary" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="stroke-primary"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (clamped / 100) * c }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      {showLabel && (
        <span className="absolute inset-0 grid place-items-center text-xs font-bold tabular-nums">
          {localizeNumber(Math.round(clamped), language)}%
        </span>
      )}
    </div>
  );
}

export function ProgressBar({ pct, className = "" }: { pct: number; className?: string }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className={`h-3 overflow-hidden rounded-full bg-secondary ${className}`} dir="ltr">
      <motion.div
        className="gradient-primary h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
    </div>
  );
}