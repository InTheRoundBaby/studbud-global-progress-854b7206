import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { z } from "zod";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const searchSchema = z.object({
  mode: z.enum(["login", "signup"]).optional().catch(undefined),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Log in or Sign up — StudBud" },
      { name: "description", content: "Access your StudBud study dashboard." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { mode } = Route.useSearch();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsSignup(mode === "signup");
  }, [mode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(t("error"));
      return;
    }
    if ("redirected" in result && result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      toast.error(t("fillAllFields"));
      return;
    }
    if (password.length < 6) {
      toast.error(t("passwordMin"));
      return;
    }
    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name.trim() || undefined },
          },
        });
        if (error) throw error;
        toast.success(t("checkEmail"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-16">
      <AnimatedBackground />

      <div className="fixed inset-x-0 top-0 z-40 mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="glass flex items-center gap-2 rounded-full px-4 py-2 shadow-card">
          <span className="gradient-primary grid h-7 w-7 place-items-center rounded-full text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-bold">{t("appName")}</span>
        </Link>
        <LanguageSwitcher compact />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass shadow-elegant w-full max-w-md rounded-3xl p-8"
      >
        <h1 className="text-2xl font-extrabold tracking-tight">
          {isSignup ? t("createAccount") : t("welcomeBack")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSignup ? t("authSubtitleSignup") : t("authSubtitleLogin")}
        </p>

        <button
          onClick={handleGoogle}
          className="shadow-card mt-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 font-semibold transition-all hover:-translate-y-0.5 hover:shadow-elegant"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z" />
          </svg>
          {t("continueWithGoogle")}
        </button>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {t("or")}
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("displayName")}
              maxLength={80}
              className="w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("email")}
            maxLength={255}
            required
            className="w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("password")}
            maxLength={128}
            required
            className="w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={loading}
            className="gradient-primary shadow-elegant flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSignup ? t("signUp") : t("logIn")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignup ? t("haveAccount") : t("noAccount")}{" "}
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="font-semibold text-primary hover:underline"
          >
            {isSignup ? t("logIn") : t("signUp")}
          </button>
        </p>
      </motion.div>
    </div>
  );
}