import { Link, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Timer,
  Trophy,
  BookOpenCheck,
  Wrench,
  LogOut,
  Sparkles,
} from "lucide-react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { LanguageSwitcher, CalendarSwitcher } from "@/components/LanguageSwitcher";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

const NAV: { to: string; key: TranslationKey; icon: typeof Timer }[] = [
  { to: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { to: "/exams", key: "examTracker", icon: Timer },
  { to: "/rewards", key: "rewards", icon: Trophy },
  { to: "/homework", key: "homework", icon: BookOpenCheck },
  { to: "/tools", key: "usefulTools", icon: Wrench },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="relative min-h-screen pb-24 md:pb-10">
      <AnimatedBackground interactive={false} />

      {/* Top bar */}
      <header className="sticky top-0 z-40 px-3 pt-3">
        <div className="glass shadow-card mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-2xl px-4 py-2.5">
          <Link to="/dashboard" className="flex min-w-0 items-center gap-2">
            <span className="gradient-primary grid h-8 w-8 shrink-0 place-items-center rounded-xl text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-display truncate text-lg font-bold">{t("appName")}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeProps={{ className: "gradient-primary !text-primary-foreground shadow-elegant" }}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground"
              >
                <item.icon className="h-4 w-4" />
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden sm:block">
              <CalendarSwitcher />
            </div>
            <LanguageSwitcher compact />
            <button
              onClick={handleSignOut}
              title={t("logOut")}
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Calendar switcher on mobile */}
        <div className="mx-auto mt-2 flex max-w-6xl justify-center sm:hidden">
          <CalendarSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-3 bottom-3 z-40 md:hidden">
        <div className="glass shadow-elegant mx-auto flex max-w-md items-center justify-around rounded-2xl px-2 py-2">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "gradient-primary !text-primary-foreground" }}
              className="grid h-11 w-11 place-items-center rounded-xl text-muted-foreground transition-all"
            >
              <item.icon className="h-5 w-5" />
              <span className="sr-only">{t(item.key)}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}