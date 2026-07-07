import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { localizeNumber } from "@/lib/calendar";

function getRemaining(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    totalDays: diff / 86_400_000,
  };
}

export function countdownColorClass(totalDays: number | null): string {
  if (totalDays === null) return "text-destructive";
  if (totalDays > 14) return "text-success";
  if (totalDays > 7) return "text-warning";
  if (totalDays > 2) return "text-danger-orange";
  return "text-destructive";
}

export function Countdown({ date, compact = false }: { date: string; compact?: boolean }) {
  const { t, language } = useI18n();
  const [remaining, setRemaining] = useState(() => getRemaining(new Date(date)));

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining(new Date(date))), 1000);
    return () => clearInterval(id);
  }, [date]);

  const colorClass = countdownColorClass(remaining?.totalDays ?? null);

  if (!remaining) {
    return <span className={`font-bold ${colorClass}`}>{t("examPassed")}</span>;
  }

  const parts = compact
    ? [
        [remaining.days, t("days")],
        [remaining.hours, t("hours")],
      ]
    : [
        [remaining.days, t("days")],
        [remaining.hours, t("hours")],
        [remaining.minutes, t("minutes")],
        [remaining.seconds, t("seconds")],
      ];

  return (
    <div className={`flex items-baseline gap-2 tabular-nums ${colorClass}`} dir="ltr">
      {parts.map(([value, label], i) => (
        <span key={i} className="flex items-baseline gap-0.5">
          <span className={compact ? "text-lg font-extrabold" : "font-display text-xl font-extrabold"}>
            {localizeNumber(value, language)}
          </span>
          <span className="text-xs font-medium opacity-70">{label}</span>
        </span>
      ))}
    </div>
  );
}