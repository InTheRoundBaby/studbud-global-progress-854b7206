import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { ACHIEVEMENTS, XP_PER_EXAM, XP_PER_LESSON, levelFromXp } from "@/lib/gamification";
import { useI18n, type TranslationKey } from "@/lib/i18n";

export type Exam = Tables<"exams">;
export type Chapter = Tables<"chapters">;
export type Lesson = Tables<"lessons">;
export type Homework = Tables<"homework">;
export type Resource = Tables<"resources">;
export type UserStats = Tables<"user_stats">;
export type Achievement = Tables<"achievements">;

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not signed in");
  return data.user.id;
}

export function useExamsData() {
  return useQuery({
    queryKey: ["exams-data"],
    queryFn: async () => {
      const [exams, chapters, lessons] = await Promise.all([
        supabase.from("exams").select("*").order("exam_date", { ascending: true }),
        supabase.from("chapters").select("*").order("position"),
        supabase.from("lessons").select("*").order("position"),
      ]);
      if (exams.error) throw exams.error;
      if (chapters.error) throw chapters.error;
      if (lessons.error) throw lessons.error;
      return {
        exams: exams.data,
        chapters: chapters.data,
        lessons: lessons.data,
      };
    },
  });
}

export function useStats() {
  return useQuery({
    queryKey: ["user-stats"],
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (data) return data;
      // Safety net for accounts created before the trigger existed
      const { data: created, error: insErr } = await supabase
        .from("user_stats")
        .insert({ user_id: userId })
        .select()
        .single();
      if (insErr) throw insErr;
      return created;
    },
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("achievements").select("*");
      if (error) throw error;
      return data;
    },
  });
}

export function useHomework() {
  return useQuery({
    queryKey: ["homework"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homework")
        .select("*")
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useResources() {
  return useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function fireConfetti() {
  confetti({ particleCount: 120, spread: 75, origin: { y: 0.65 } });
}

export function fireBigConfetti() {
  const end = Date.now() + 1200;
  const frame = () => {
    confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0 } });
    confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Awards XP / streak / achievements after a study action.
 * kind: "lesson" (+10 XP) or "exam" (+50 XP). delta -1 undoes a lesson.
 */
export function useAwardProgress() {
  const queryClient = useQueryClient();
  const { t } = useI18n();

  return useMutation({
    mutationFn: async ({ kind, delta }: { kind: "lesson" | "exam"; delta: 1 | -1 }) => {
      const userId = await getUserId();
      const { data: stats, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;

      const current = stats ?? {
        xp: 0,
        streak_days: 0,
        last_activity_date: null,
        lessons_completed_total: 0,
        exams_completed_total: 0,
      };

      const xpDelta = (kind === "lesson" ? XP_PER_LESSON : XP_PER_EXAM) * delta;
      const xp = Math.max(0, current.xp + xpDelta);
      const lessons = Math.max(
        0,
        current.lessons_completed_total + (kind === "lesson" ? delta : 0),
      );
      const examsDone = Math.max(
        0,
        current.exams_completed_total + (kind === "exam" ? delta : 0),
      );

      let streak = current.streak_days;
      let lastDate = current.last_activity_date;
      if (delta === 1) {
        const today = todayStr();
        if (lastDate !== today) {
          streak = lastDate === yesterdayStr() ? streak + 1 : 1;
          lastDate = today;
        }
      }

      const level = levelFromXp(xp);
      const { error: upErr } = await supabase
        .from("user_stats")
        .update({
          xp,
          level,
          streak_days: streak,
          last_activity_date: lastDate,
          lessons_completed_total: lessons,
          exams_completed_total: examsDone,
        })
        .eq("user_id", userId);
      if (upErr) throw upErr;

      // Check for new achievements
      const newlyEarned: string[] = [];
      if (delta === 1) {
        const { data: earned } = await supabase.from("achievements").select("achievement_key");
        const earnedKeys = new Set((earned ?? []).map((a) => a.achievement_key));
        const snapshot = { lessons, exams: examsDone, level, streak };
        for (const def of ACHIEVEMENTS) {
          if (!earnedKeys.has(def.key) && def.check(snapshot)) {
            const { error: aErr } = await supabase
              .from("achievements")
              .insert({ user_id: userId, achievement_key: def.key });
            if (!aErr) newlyEarned.push(def.key);
          }
        }
      }
      return { newlyEarned, kind, delta };
    },
    onSuccess: ({ newlyEarned, kind, delta }) => {
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      if (delta === 1 && kind === "lesson") toast.success(t("lessonDone"));
      if (delta === 1 && kind === "exam") {
        toast.success(t("examCompleted"));
        fireBigConfetti();
      }
      for (const key of newlyEarned) {
        const def = ACHIEVEMENTS.find((a) => a.key === key);
        toast(`${def?.icon ?? "🏅"} ${t("achievementUnlocked")}`, {
          description: t(`ach_${key}` as TranslationKey),
        });
        fireConfetti();
      }
    },
  });
}