import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Plus, Trash2, ListChecks, FolderTree } from "lucide-react";
import { parse as parseJalali, format as formatJalali } from "date-fns-jalali";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const EXAM_COLORS = [
  { key: "pink", className: "bg-primary" },
  { key: "rose", className: "bg-primary-glow" },
  { key: "peach", className: "bg-danger-orange" },
  { key: "gold", className: "bg-warning" },
  { key: "mint", className: "bg-success" },
] as const;

interface DraftChapter {
  title: string;
  lessons: string[];
}

export function ExamCreateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, calendar, language } = useI18n();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"simple" | "chapters">("simple");
  const [form, setForm] = useState({
    name: "",
    subject: "",
    exam_date: "",
    notes: "",
    priority: "medium",
    color: "pink",
    lessonCount: 10,
  });
  const [chapters, setChapters] = useState<DraftChapter[]>([{ title: "", lessons: [""] }]);

  // Jalali picker parts (only used when calendar === "jalali")
  const [jalali, setJalali] = useState({ y: "", m: "", d: "", h: "09", min: "00" });

  const updateJalali = (patch: Partial<typeof jalali>) => {
    const next = { ...jalali, ...patch };
    setJalali(next);
    const { y, m, d, h, min } = next;
    if (y && m && d && h && min) {
      const str = `${y}/${m.padStart(2, "0")}/${d.padStart(2, "0")} ${h.padStart(2, "0")}:${min.padStart(2, "0")}`;
      const parsed = parseJalali(str, "yyyy/MM/dd HH:mm", new Date());
      if (!Number.isNaN(parsed.getTime())) {
        // datetime-local shape so onSubmit's new Date() works
        const pad = (n: number) => String(n).padStart(2, "0");
        const local = `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
        setForm((f) => ({ ...f, exam_date: local }));
      }
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const userId = u.user.id;

      const { data: exam, error } = await supabase
        .from("exams")
        .insert({
          user_id: userId,
          name: form.name.trim(),
          subject: form.subject.trim(),
          exam_date: new Date(form.exam_date).toISOString(),
          notes: form.notes.trim(),
          priority: form.priority,
          color: form.color,
          mode,
        })
        .select()
        .single();
      if (error) throw error;

      if (mode === "simple") {
        const count = Math.min(200, Math.max(1, form.lessonCount));
        const { data: chapter, error: chErr } = await supabase
          .from("chapters")
          .insert({ exam_id: exam.id, user_id: userId, title: "__simple__", position: 0 })
          .select()
          .single();
        if (chErr) throw chErr;
        const { error: lsErr } = await supabase.from("lessons").insert(
          Array.from({ length: count }, (_, i) => ({
            chapter_id: chapter.id,
            exam_id: exam.id,
            user_id: userId,
            title: `${t("lesson")} ${i + 1}`,
            position: i,
          })),
        );
        if (lsErr) throw lsErr;
      } else {
        const validChapters = chapters
          .map((c) => ({ title: c.title.trim(), lessons: c.lessons.map((l) => l.trim()).filter(Boolean) }))
          .filter((c) => c.title && c.lessons.length > 0);
        for (let ci = 0; ci < validChapters.length; ci++) {
          const ch = validChapters[ci];
          const { data: chapter, error: chErr } = await supabase
            .from("chapters")
            .insert({ exam_id: exam.id, user_id: userId, title: ch.title, position: ci })
            .select()
            .single();
          if (chErr) throw chErr;
          const { error: lsErr } = await supabase.from("lessons").insert(
            ch.lessons.map((title, li) => ({
              chapter_id: chapter.id,
              exam_id: exam.id,
              user_id: userId,
              title,
              position: li,
            })),
          );
          if (lsErr) throw lsErr;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams-data"] });
      toast.success(t("saved"));
      onClose();
      setForm({ name: "", subject: "", exam_date: "", notes: "", priority: "medium", color: "pink", lessonCount: 10 });
      setChapters([{ title: "", lessons: [""] }]);
    },
    onError: () => toast.error(t("error")),
  });

  const inputClass =
    "w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-foreground/25 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="shadow-elegant my-8 w-full max-w-2xl rounded-3xl bg-card p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-extrabold">{t("newExam")}</h2>
              <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.name.trim() || !form.exam_date) {
                  toast.error(t("fillAllFields"));
                  return;
                }
                createMutation.mutate();
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("examName")}
                  maxLength={150}
                  className={inputClass}
                />
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder={t("subject")}
                  maxLength={100}
                  className={inputClass}
                />
                <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
                  {t("examDate")}
                  {calendar === "jalali" ? (
                    <div className="flex gap-1.5" dir="ltr">
                      <input
                        inputMode="numeric"
                        placeholder={language === "fa" ? "سال" : "yyyy"}
                        value={jalali.y}
                        onChange={(e) => updateJalali({ y: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                        className={`${inputClass} text-center text-foreground`}
                      />
                      <input
                        inputMode="numeric"
                        placeholder={language === "fa" ? "ماه" : "mm"}
                        value={jalali.m}
                        onChange={(e) => updateJalali({ m: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                        className={`${inputClass} text-center text-foreground`}
                      />
                      <input
                        inputMode="numeric"
                        placeholder={language === "fa" ? "روز" : "dd"}
                        value={jalali.d}
                        onChange={(e) => updateJalali({ d: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                        className={`${inputClass} text-center text-foreground`}
                      />
                      <input
                        type="time"
                        value={`${jalali.h}:${jalali.min}`}
                        onChange={(e) => {
                          const [h, min] = e.target.value.split(":");
                          updateJalali({ h: h ?? "00", min: min ?? "00" });
                        }}
                        className={`${inputClass} text-foreground`}
                      />
                    </div>
                  ) : (
                    <input
                      type="datetime-local"
                      value={form.exam_date}
                      onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
                      className={`${inputClass} text-foreground`}
                      dir="ltr"
                    />
                  )}
                  {calendar === "jalali" && form.exam_date && (
                    <span className="text-[11px] text-muted-foreground" dir="ltr">
                      {formatJalali(new Date(form.exam_date), "yyyy/MM/dd HH:mm")}
                    </span>
                  )}
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
                  {t("priority")}
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className={`${inputClass} text-foreground`}
                  >
                    <option value="low">{t("low")}</option>
                    <option value="medium">{t("medium")}</option>
                    <option value="high">{t("high")}</option>
                  </select>
                </label>
              </div>

              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={t("notes")}
                maxLength={1000}
                rows={2}
                className={inputClass}
              />

              {/* Color picker */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">{t("color")}:</span>
                {EXAM_COLORS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setForm({ ...form, color: c.key })}
                    className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${c.className} ${
                      form.color === c.key ? "ring-2 ring-ring ring-offset-2" : ""
                    }`}
                    aria-label={c.key}
                  />
                ))}
              </div>

              {/* Mode selector */}
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMode("simple")}
                  className={`rounded-2xl border-2 p-4 text-start transition-all ${
                    mode === "simple" ? "border-primary bg-primary-soft" : "border-border bg-card hover:border-ring"
                  }`}
                >
                  <ListChecks className="mb-2 h-5 w-5 text-primary" />
                  <p className="font-bold">{t("simpleMode")}</p>
                  <p className="text-xs text-muted-foreground">{t("simpleModeDesc")}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("chapters")}
                  className={`rounded-2xl border-2 p-4 text-start transition-all ${
                    mode === "chapters" ? "border-primary bg-primary-soft" : "border-border bg-card hover:border-ring"
                  }`}
                >
                  <FolderTree className="mb-2 h-5 w-5 text-primary" />
                  <p className="font-bold">{t("chaptersMode")}</p>
                  <p className="text-xs text-muted-foreground">{t("chaptersModeDesc")}</p>
                </button>
              </div>

              {mode === "simple" ? (
                <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
                  {t("numberOfLessons")}
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={form.lessonCount}
                    onChange={(e) => setForm({ ...form, lessonCount: Number(e.target.value) })}
                    className={`${inputClass} text-foreground`}
                    dir="ltr"
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  {chapters.map((ch, ci) => (
                    <div key={ci} className="rounded-2xl border border-border bg-secondary/40 p-4">
                      <div className="flex items-center gap-2">
                        <input
                          value={ch.title}
                          onChange={(e) =>
                            setChapters(chapters.map((c, j) => (j === ci ? { ...c, title: e.target.value } : c)))
                          }
                          placeholder={`${t("chapterTitle")} ${ci + 1}`}
                          maxLength={150}
                          className={inputClass}
                        />
                        {chapters.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setChapters(chapters.filter((_, j) => j !== ci))}
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="mt-2 space-y-2">
                        {ch.lessons.map((lesson, li) => (
                          <div key={li} className="flex items-center gap-2">
                            <input
                              value={lesson}
                              onChange={(e) =>
                                setChapters(
                                  chapters.map((c, j) =>
                                    j === ci
                                      ? { ...c, lessons: c.lessons.map((l, k) => (k === li ? e.target.value : l)) }
                                      : c,
                                  ),
                                )
                              }
                              placeholder={`${t("lessonTitle")} ${li + 1}`}
                              maxLength={200}
                              className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />
                            {ch.lessons.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setChapters(
                                    chapters.map((c, j) =>
                                      j === ci ? { ...c, lessons: c.lessons.filter((_, k) => k !== li) } : c,
                                    ),
                                  )
                                }
                                className="shrink-0 text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setChapters(
                              chapters.map((c, j) => (j === ci ? { ...c, lessons: [...c.lessons, ""] } : c)),
                            )
                          }
                          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          <Plus className="h-3.5 w-3.5" /> {t("addLesson")}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setChapters([...chapters, { title: "", lessons: [""] }])}
                    className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                  >
                    <Plus className="h-4 w-4" /> {t("addChapter")}
                  </button>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="gradient-primary shadow-elegant rounded-2xl px-7 py-3 font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
                >
                  {t("create")}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-border px-7 py-3 font-semibold text-muted-foreground"
                >
                  {t("cancel")}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}