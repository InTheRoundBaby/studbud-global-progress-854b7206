import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Globe, Calculator, Layers3, Youtube, Box, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useResources } from "@/hooks/useStudData";
import { useI18n, type TranslationKey } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/tools")({
  component: Tools,
});

const CATEGORIES = [
  { key: "website", icon: Globe },
  { key: "calculator", icon: Calculator },
  { key: "flashcards", icon: Layers3 },
  { key: "youtube", icon: Youtube },
  { key: "other", icon: Box },
] as const;

function Tools() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data: resources } = useResources();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [form, setForm] = useState({ title: "", url: "", category: "website", description: "" });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      let url = form.url.trim();
      if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
      const { error } = await supabase.from("resources").insert({
        user_id: u.user.id,
        title: form.title.trim(),
        url,
        category: form.category,
        description: form.description.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setForm({ title: "", url: "", category: "website", description: "" });
      setShowForm(false);
      toast.success(t("saved"));
    },
    onError: () => toast.error(t("error")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("resources").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast.success(t("deleted"));
    },
  });

  const filtered = (resources ?? []).filter((r) => filter === "all" || r.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("usefulTools")}</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="gradient-primary shadow-elegant flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
        >
          <Plus className="h-4 w-4" /> {t("newResource")}
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
            filter === "all" ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground"
          }`}
        >
          {t("all")}
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
              filter === c.key ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground"
            }`}
          >
            <c.icon className="h-3.5 w-3.5" />
            {t(`cat_${c.key}` as TranslationKey)}
          </button>
        ))}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass shadow-card overflow-hidden rounded-3xl"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.title.trim() || !form.url.trim()) {
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
                placeholder={t("resourceTitle")}
                maxLength={120}
                className="rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder={t("url")}
                maxLength={500}
                dir="ltr"
                className="rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {t(`cat_${c.key}` as TranslationKey)}
                  </option>
                ))}
              </select>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t("description")}
                maxLength={300}
                className="rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
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

      {/* Resource cards */}
      {filtered.length === 0 ? (
        <p className="py-14 text-center text-muted-foreground">{t("noResources")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r, i) => {
            const cat = CATEGORIES.find((c) => c.key === r.category) ?? CATEGORIES[4];
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="glass shadow-card group rounded-3xl p-5 transition-all hover:-translate-y-1 hover:shadow-elegant"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="gradient-primary grid h-10 w-10 place-items-center rounded-xl text-primary-foreground">
                    <cat.icon className="h-5 w-5" />
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(r.id)}
                    className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                    title={t("delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="font-bold">{r.title}</p>
                {r.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
                )}
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  {t("open")} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}