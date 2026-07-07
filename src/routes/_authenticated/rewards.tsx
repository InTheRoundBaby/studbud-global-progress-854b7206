import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Flame, Star, Zap } from "lucide-react";
import { useAchievements, useStats } from "@/hooks/useStudData";
import { ProgressBar } from "@/components/ProgressRing";
import { ACHIEVEMENTS, levelProgress } from "@/lib/gamification";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { localizeNumber } from "@/lib/calendar";

export const Route = createFileRoute("/_authenticated/rewards")({
  component: Rewards,
});

function Rewards() {
  const { t, language } = useI18n();
  const { data: stats } = useStats();
  const { data: earned } = useAchievements();

  const earnedKeys = new Set((earned ?? []).map((a) => a.achievement_key));
  const xp = stats?.xp ?? 0;
  const prog = levelProgress(xp);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("rewards")}</h1>

      {/* Level card */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="gradient-primary shadow-elegant relative overflow-hidden rounded-3xl p-7 text-primary-foreground"
      >
        <div className="absolute -top-10 -right-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="flex flex-wrap items-center gap-6">
          <motion.div
            initial={{ scale: 0.6, rotate: -12 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-white/15 backdrop-blur"
          >
            <Star className="h-10 w-10" fill="currentColor" />
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium opacity-85">{t("level")}</p>
            <p className="font-display text-5xl font-extrabold tabular-nums">
              {localizeNumber(stats?.level ?? 1, language)}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="rounded-2xl bg-white/15 px-5 py-3 text-center backdrop-blur">
              <Zap className="mx-auto mb-1 h-5 w-5" />
              <p className="font-display text-xl font-extrabold tabular-nums">
                {localizeNumber(xp, language)}
              </p>
              <p className="text-xs opacity-85">{t("xp")}</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-5 py-3 text-center backdrop-blur">
              <Flame className="mx-auto mb-1 h-5 w-5" />
              <p className="font-display text-xl font-extrabold tabular-nums">
                {localizeNumber(stats?.streak_days ?? 0, language)}
              </p>
              <p className="text-xs opacity-85">{t("dayStreak")}</p>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs font-semibold opacity-85">
            <span>
              {localizeNumber(prog.current, language)} / {localizeNumber(prog.needed, language)} {t("xp")}
            </span>
            <span>{t("xpToNext")}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/20" dir="ltr">
            <motion.div
              className="h-full rounded-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${prog.pct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      {/* Achievements grid */}
      <div>
        <h2 className="mb-4 text-lg font-bold">{t("achievements")}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {ACHIEVEMENTS.map((def, i) => {
            const unlocked = earnedKeys.has(def.key);
            return (
              <motion.div
                key={def.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className={`shadow-card rounded-3xl p-5 text-center transition-all ${
                  unlocked
                    ? "glass hover:-translate-y-1 hover:shadow-elegant"
                    : "border border-dashed border-border bg-muted/50 opacity-60 grayscale"
                }`}
              >
                <motion.span
                  className="mb-2 inline-block text-4xl"
                  animate={unlocked ? { rotate: [0, -8, 8, 0] } : undefined}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.05 }}
                >
                  {def.icon}
                </motion.span>
                <p className="text-sm font-bold">{t(`ach_${def.key}` as TranslationKey)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {unlocked ? t(`ach_${def.key}_desc` as TranslationKey) : t("locked")}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Level progress bar duplicated at bottom for satisfaction */}
      <div className="glass shadow-card rounded-3xl p-6">
        <div className="mb-3 flex justify-between text-sm font-semibold">
          <span>{t("lessonsCompleted")}</span>
          <span className="tabular-nums">
            {localizeNumber(stats?.lessons_completed_total ?? 0, language)}
          </span>
        </div>
        <ProgressBar pct={Math.min(100, ((stats?.lessons_completed_total ?? 0) % 50) * 2)} />
      </div>
    </div>
  );
}