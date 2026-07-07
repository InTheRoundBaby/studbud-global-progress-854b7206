import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, ChevronDown, Circle, Trash2, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAwardProgress, type Chapter, type Exam, type Lesson } from "@/hooks/useStudData";
import { Countdown } from "@/components/Countdown";
import { ProgressBar, ProgressRing } from "@/components/ProgressRing";
import { useI18n } from "@/lib/i18n";
import { formatDate, localizeNumber } from "@/lib/calendar";

const COLOR_BAR: Record<string, string> = {
  pink: "bg-primary",
  rose: "bg-primary-glow",
  peach: "bg-danger-orange",
  gold: "bg-warning",
  mint: "bg-success",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-success/15 text-success",
  medium: "bg-warning/20 text-danger-orange",
  high: "bg-destructive/10 text-destructive",
};

export function ExamCard({
  exam,
  chapters,
  lessons,
}: {
  exam: Exam;
  chapters: Chapter[];
  lessons: Lesson[];
}) {
  const { t, language, calendar } = useI18n();
  const queryClient = useQueryClient();
  const award = useAwardProgress();
  const [expanded, setExpanded] = useState(false);
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set());

  const done = lessons.filter((l) => l.completed).length;
  const pct = lessons.length ? (done / lessons.length) * 100 : 0;
  const isSimple = exam.mode === "simple";

  const toggleLesson = useMutation({
    mutationFn: async (lesson: Lesson) => {
      const completed = !lesson.completed;
      const { error } = await supabase
        .from("lessons")
        .update({ completed, completed_at: completed ? new Date().toISOString() : null })
        .eq("id", lesson.id);
      if (error) throw error;
      return completed;
    },
    onSuccess: (completed) => {
      queryClient.invalidateQueries({ queryKey: ["exams-data"] });
      award.mutate({ kind: "lesson", delta: completed ? 1 : -1 });
    },
    onError: () => toast.error(t("error")),
  });

  const completeExam = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("exams").update({ completed: true }).eq("id", exam.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams-data"] });
      award.mutate({ kind: "exam", delta: 1 });
    },
  });

  const deleteExam = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("exams").delete().eq("id", exam.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams-data"] });
      toast.success(t("deleted"));
    },
  });

  const toggleChapter = (id: string) => {
    setOpenChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass shadow-card overflow-hidden rounded-3xl transition-shadow hover:shadow-elegant ${
        exam.completed ? "opacity-75" : ""
      }`}
    >
      <div className={`h-1.5 w-full ${COLOR_BAR[exam.color] ?? COLOR_BAR.pink}`} />
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <ProgressRing pct={pct} size={60} stroke={6} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-bold">{exam.name}</h3>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${PRIORITY_STYLES[exam.priority] ?? ""}`}>
                  {t(exam.priority as "low" | "medium" | "high")}
                </span>
                {exam.completed && (
                  <span className="flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                    <Trophy className="h-3 w-3" /> {t("completed")}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {exam.subject && `${exam.subject} · `}
                {formatDate(exam.exam_date, calendar, language, true)}
              </p>
            </div>
          </div>
          {!exam.completed && <Countdown date={exam.exam_date} />}
        </div>

        {exam.notes && <p className="mt-3 text-sm text-muted-foreground">{exam.notes}</p>}

        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs font-semibold text-muted-foreground">
            <span>
              {localizeNumber(done, language)} / {localizeNumber(lessons.length, language)} {t("progress").toLowerCase()}
            </span>
            <span className="tabular-nums">{localizeNumber(Math.round(pct), language)}%</span>
          </div>
          <ProgressBar pct={pct} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setExpanded((s) => !s)}
            className="flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-accent"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
            {t("progress")}
          </button>
          {!exam.completed && pct >= 100 && (
            <button
              onClick={() => completeExam.mutate()}
              className="gradient-primary shadow-elegant flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
            >
              <Trophy className="h-4 w-4" /> {t("markComplete")}
            </button>
          )}
          <button
            onClick={() => {
              if (window.confirm(t("confirmDelete"))) deleteExam.mutate();
            }}
            className="ms-auto grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            title={t("delete")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Lessons */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                {isSimple ? (
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {lessons.map((lesson) => (
                      <LessonRow key={lesson.id} lesson={lesson} onToggle={() => toggleLesson.mutate(lesson)} />
                    ))}
                  </div>
                ) : (
                  chapters.map((chapter) => {
                    const chLessons = lessons.filter((l) => l.chapter_id === chapter.id);
                    const chDone = chLessons.filter((l) => l.completed).length;
                    const isOpen = openChapters.has(chapter.id);
                    return (
                      <div key={chapter.id} className="rounded-2xl border border-border bg-card/60">
                        <button
                          onClick={() => toggleChapter(chapter.id)}
                          className="flex w-full items-center gap-3 p-3.5 text-start"
                        >
                          <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          <span className="min-w-0 flex-1 truncate font-semibold">{chapter.title}</span>
                          <span className="shrink-0 text-xs font-bold text-muted-foreground tabular-nums">
                            {localizeNumber(chDone, language)}/{localizeNumber(chLessons.length, language)}
                          </span>
                          <ProgressRing pct={chLessons.length ? (chDone / chLessons.length) * 100 : 0} size={32} stroke={4} showLabel={false} />
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-1 px-4 pb-3">
                                {chLessons.map((lesson) => (
                                  <LessonRow key={lesson.id} lesson={lesson} onToggle={() => toggleLesson.mutate(lesson)} />
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function LessonRow({ lesson, onToggle }: { lesson: Lesson; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-start text-sm transition-colors hover:bg-accent/60"
    >
      <motion.span whileTap={{ scale: 0.8 }} className="shrink-0">
        {lesson.completed ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </motion.span>
      <span className={lesson.completed ? "text-muted-foreground line-through" : ""}>{lesson.title}</span>
    </button>
  );
}