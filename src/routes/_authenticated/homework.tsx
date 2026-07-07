import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle2, Circle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useHomework, type Homework } from "@/hooks/useStudData";
import { useI18n } from "@/lib/i18n";
import { formatDate, localizeNumber } from "@/lib/calendar";

export const Route = createFileRoute("/_authenticated/homework")({
  component: HomeworkPage,
});

interface ChecklistItem {
  text: string;
  done: boolean;
}

function parseChecklist(hw: Homework): ChecklistItem[] {
  if (!Array.isArray(hw.checklist)) return [];
  return (hw.checklist as unknown as ChecklistItem[]).filter(
    (i) => i && typeof i.text === "string",
  );
}

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-success/15 text-success",
  medium: "bg-warning/20 text-danger-orange",
  high: "bg-destructive/10 text-destructive",
};

function HomeworkPage() {
  const { t, language, calendar } = useI18n();
  const queryClient = useQueryClient();
  const { data: homework } = useHomework();
  const [filter, setFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subject: "",
    due_date: "",
    priority: "medium",
    notes: "",
    checklistText: "",
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["homework"] });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const checklist = form.checklistText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((text) => ({ text, done: false }));
      const { error } = await supabase.from("homework").insert({
        user_id: u.user.id,
        title: form.title.trim(),
        subject: form.subject.trim(),
        due_date: new Date(form.due_date).toISOString(),
        priority: form.priority,
        notes: form.notes.trim(),
        checklist,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setForm({ title: "", subject: "", due_date: "", priority: "medium", notes: "", checklistText: "" });
      toast.success(t("saved"));
    },
    onError: () => toast.error(t("error")),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await supabase.from("homework").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("homework").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success(t("deleted"));
    },
  });

  const list = (homework ?? []).filter((hw) => {
    if (filter === "all") return true;
    if (filter === "overdue")
      return hw.status !== "done" && new Date(hw.due_date).getTime() < Date.now();
    return hw.status === filter;
  });

  const statusFilters = [
    { key: "all", label: t("all") },
    { key: "todo", label: t("todo") },
    { key: "in_progress", label: t("inProgress") },
    { key: "done", label: t("done") },
    { key: "overdue", label: t("overdue") },
  ];

  const cycleStatus = (hw: Homework) => {
    const next = hw.status === "todo" ? "in_progress" : hw.status === "in_progress" ? "done" : "todo";
    updateMutation.mutate({ id: hw.id, patch: { status: next } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("homework")}</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="gradient-primary shadow-elegant flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
        >
          <Plus className="h-4 w-4" /> {t("newHomework")}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
              filter === f.key ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass shadow-card overflow-hidden rounded-3xl"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.title.trim() || !form.due_date) {
                toast.error(t("fillAllFields"));
                return;
              }
              addMutation.mutate();
            }}
          >
            <div className="grid gap-3 p-6 sm:grid-cols-2">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t("title")}
                maxLength={150}
                className="rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder={t("subject")}
                maxLength={100}
                className="rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
                {t("dueDate")}
                <input
                  type="datetime-local"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="rounded-2xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  dir="ltr"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
                {t("priority")}
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="rounded-2xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="low">{t("low")}</option>
                  <option value="medium">{t("medium")}</option>
                  <option value="high">{t("high")}</option>
                </select>
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={t("notes")}
                maxLength={1000}
                rows={2}
                className="rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring sm:col-span-2"
              />
              <textarea
                value={form.checklistText}
                onChange={(e) => setForm({ ...form, checklistText: e.target.value })}
                placeholder={`${t("checklist")} (${t("addItem")} ⏎)`}
                maxLength={2000}
                rows={3}
                className="rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring sm:col-span-2"
              />
              <div className="flex gap-2 sm:col-span-2">
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="gradient-primary rounded-2xl px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {t("save")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-2xl border border-border px-6 py-2.5 text-sm font-semibold text-muted-foreground"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {list.length === 0 ? (
        <p className="py-14 text-center text-muted-foreground">{t("noHomework")}</p>
      ) : (
        <div className="space-y-4">
          {list.map((hw, i) => {
            const checklist = parseChecklist(hw);
            const overdue = hw.status !== "done" && new Date(hw.due_date).getTime() < Date.now();
            const daysLeft = Math.ceil((new Date(hw.due_date).getTime() - Date.now()) / 86_400_000);
            return (
              <motion.div
                key={hw.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className={`glass shadow-card rounded-3xl p-5 ${hw.status === "done" ? "opacity-70" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`font-bold ${hw.status === "done" ? "line-through" : ""}`}>{hw.title}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${PRIORITY_STYLES[hw.priority] ?? PRIORITY_STYLES.medium}`}>
                        {t(hw.priority as "low" | "medium" | "high")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {hw.subject && `${hw.subject} · `}
                      {formatDate(hw.due_date, calendar, language, true)}
                    </p>
                    {hw.notes && <p className="mt-2 text-sm text-muted-foreground">{hw.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                        overdue
                          ? "bg-destructive/10 text-destructive"
                          : hw.status === "done"
                            ? "bg-success/15 text-success"
                            : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      {overdue
                        ? t("overdue")
                        : hw.status === "done"
                          ? t("done")
                          : `${t("dueIn")} ${localizeNumber(Math.max(0, daysLeft), language)} ${t("days")}`}
                    </span>
                    <button
                      onClick={() => cycleStatus(hw)}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                        hw.status === "done"
                          ? "bg-success/15 text-success"
                          : hw.status === "in_progress"
                            ? "bg-warning/20 text-danger-orange"
                            : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {hw.status === "done" ? t("done") : hw.status === "in_progress" ? t("inProgress") : t("todo")}
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(hw.id)}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                      title={t("delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {checklist.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                    {checklist.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const next = checklist.map((c, j) =>
                            j === idx ? { ...c, done: !c.done } : c,
                          );
                          updateMutation.mutate({ id: hw.id, patch: { checklist: next } });
                        }}
                        className="flex w-full items-center gap-2 text-start text-sm transition-colors hover:text-primary"
                      >
                        {item.done ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className={item.done ? "text-muted-foreground line-through" : ""}>
                          {item.text}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}