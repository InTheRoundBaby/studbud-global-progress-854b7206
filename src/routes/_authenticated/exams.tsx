import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useExamsData } from "@/hooks/useStudData";
import { ExamCard } from "@/components/exams/ExamCard";
import { ExamCreateDialog } from "@/components/exams/ExamCreateDialog";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/exams")({
  component: ExamsPage,
});

function ExamsPage() {
  const { t } = useI18n();
  const { data } = useExamsData();
  const [dialogOpen, setDialogOpen] = useState(false);

  const exams = data?.exams ?? [];
  const chapters = data?.chapters ?? [];
  const lessons = data?.lessons ?? [];

  const active = exams.filter((e) => !e.completed);
  const completed = exams.filter((e) => e.completed);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("examTracker")}</h1>
        <button
          onClick={() => setDialogOpen(true)}
          className="gradient-primary shadow-elegant flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
        >
          <Plus className="h-4 w-4" /> {t("newExam")}
        </button>
      </div>

      {exams.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">{t("noExams")}</p>
      ) : (
        <div className="space-y-4">
          {active.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              chapters={chapters.filter((c) => c.exam_id === exam.id)}
              lessons={lessons.filter((l) => l.exam_id === exam.id)}
            />
          ))}
          {completed.length > 0 && (
            <>
              <h2 className="pt-4 text-lg font-bold text-muted-foreground">{t("completed")}</h2>
              {completed.map((exam) => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  chapters={chapters.filter((c) => c.exam_id === exam.id)}
                  lessons={lessons.filter((l) => l.exam_id === exam.id)}
                />
              ))}
            </>
          )}
        </div>
      )}

      <ExamCreateDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}