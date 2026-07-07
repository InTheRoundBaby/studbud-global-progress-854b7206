export const XP_PER_LESSON = 10;
export const XP_PER_EXAM = 50;
export const XP_PER_LEVEL = 100;

export function levelFromXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function levelProgress(xp: number): { current: number; needed: number; pct: number } {
  const current = xp % XP_PER_LEVEL;
  return { current, needed: XP_PER_LEVEL, pct: (current / XP_PER_LEVEL) * 100 };
}

export interface AchievementDef {
  key: string;
  icon: string;
  check: (s: {
    lessons: number;
    exams: number;
    level: number;
    streak: number;
  }) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "first_lesson", icon: "🌱", check: (s) => s.lessons >= 1 },
  { key: "ten_lessons", icon: "📚", check: (s) => s.lessons >= 10 },
  { key: "fifty_lessons", icon: "⚡", check: (s) => s.lessons >= 50 },
  { key: "hundred_lessons", icon: "🏛️", check: (s) => s.lessons >= 100 },
  { key: "first_exam", icon: "🏆", check: (s) => s.exams >= 1 },
  { key: "level_5", icon: "⭐", check: (s) => s.level >= 5 },
  { key: "level_10", icon: "🎓", check: (s) => s.level >= 10 },
  { key: "streak_3", icon: "🔥", check: (s) => s.streak >= 3 },
  { key: "streak_7", icon: "🚀", check: (s) => s.streak >= 7 },
  { key: "streak_30", icon: "💎", check: (s) => s.streak >= 30 },
];