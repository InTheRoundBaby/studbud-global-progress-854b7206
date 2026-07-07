import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { BookOpen, CheckCircle2, CircleDashed, GraduationCap, ArrowRight } from "lucide-react";
import { useExamsData, useStats } from "@/hooks/useStudData";
import { ProgressBar, ProgressRing } from "@/components/ProgressRing";
import { Countdown } from "@/components/Countdown";
import { useI18n } from "@/lib/i18n";
import { formatDate, localizeNumber } from "@/lib/calendar";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { t, language, calendar } = useI18n();
  const { data } = useExamsData();
  const { data: stats } = useStats();

  const exams = data?.exams ?? [];
  const lessons = data?.lessons ?? [];
  const completedLessons = lessons.filter((l) => l.completed).length;
  const remainingLessons = lessons.length - completedLessons;
  const overallPct = lessons.length ? (completedLessons / lessons.length) * 100 : 0;
  const upcoming = exams
    .filter((e) => !e.completed && new Date(e.exam_date).getTime() > Date.now())
    .slice(0, 4);

  const cards = [
    { icon: GraduationCap, label: t("totalExams"), value: exams.length },
    { icon: CheckCircle2, label: t("lessonsCompleted"), value: completedLessons },
    { icon: CircleDashed, label: t("lessonsRemaining"), value: remainingLessons },
    { icon: BookOpen, label: t("streak"), value: stats?.streak_days ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("dashboard")}</h1>
        {stats && (
          <div className="glass shadow-card flex items-center gap-3 rounded-2xl px-4 py-2">
            <span className="text-sm font-semibold text-muted-foreground">
              {t("level")} {localizeNumber(stats.level, language)}
            </span>
            <span className="gradient-primary rounded-full px-3 py-1 text-xs font-bold text-primary-foreground">
              {localizeNumber(stats.xp, language)} {t("xp")}
            </span>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            className="glass shadow-card rounded-3xl p-5 transition-shadow hover:shadow-elegant"
          >
            <div className="gradient-primary mb-3 grid h-10 w-10 place-items-center rounded-xl text-primary-foreground">
              <c.icon className="h-5 w-5" />
            </div>
            <p className="font-display text-3xl font-extrabold tabular-nums">
              {localizeNumber(c.value, language)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{c.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Big overall progress */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="glass shadow-card rounded-3xl p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{t("overallProgress")}</h2>
          <span className="gradient-text font-display text-3xl font-extrabold tabular-nums">
            {localizeNumber(Math.round(overallPct), language)}%
          </span>
        </div>
        <ProgressBar pct={overallPct} className="h-5" />
        <p className="mt-3 text-sm text-muted-foreground">
          {localizeNumber(completedLessons, language)} / {localizeNumber(lessons.length, language)}{" "}
          {t("lessonsCompleted").toLowerCase()}
        </p>
      </motion.div>

      {/* Upcoming exams */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="glass shadow-card rounded-3xl p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{t("upcomingExams")}</h2>
          <Link
            to="/exams"
            className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            {t("examTracker")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground">{t("noUpcomingExams")}</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((exam) => {
              const examLessons = lessons.filter((l) => l.exam_id === exam.id);
              const done = examLessons.filter((l) => l.completed).length;
              const pct = examLessons.length ? (done / examLessons.length) * 100 : 0;
              return (
                <div
                  key={exam.id}
                  className="shadow-card flex items-center gap-4 rounded-2xl border border-border bg-card/70 p-4"
                >
                  <ProgressRing pct={pct} size={52} stroke={5} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{exam.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {exam.subject && `${exam.subject} · `}
                      {formatDate(exam.exam_date, calendar, language)}
                    </p>
                  </div>
                  <Countdown date={exam.exam_date} compact />
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}