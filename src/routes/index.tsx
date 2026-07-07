import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Timer, Layers, Flame, Languages, Sparkles } from "lucide-react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, -120]);
  const blobY = useTransform(scrollY, [0, 600], [0, 160]);
  const cardY = useTransform(scrollY, [0, 800], [0, -60]);
  const heroOpacity = useTransform(scrollY, [0, 450], [1, 0.25]);

  // If already signed in, go straight to the dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const features = [
    { icon: Timer, title: t("landingFeature1"), desc: t("landingFeature1Desc") },
    { icon: Layers, title: t("landingFeature2"), desc: t("landingFeature2Desc") },
    { icon: Flame, title: t("landingFeature3"), desc: t("landingFeature3Desc") },
    { icon: Languages, title: t("landingFeature4"), desc: t("landingFeature4Desc") },
  ];

  return (
    <div ref={ref} className="relative min-h-screen overflow-x-clip">
      <AnimatedBackground />

      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="glass flex items-center gap-2 rounded-full px-4 py-2 shadow-card">
            <span className="gradient-primary grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">{t("appName")}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <Link
              to="/auth"
              search={{ mode: "login" }}
              className="glass rounded-full px-4 py-2 text-sm font-semibold text-foreground shadow-card transition-transform hover:scale-105"
            >
              {t("logIn")}
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="gradient-primary shadow-elegant rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
            >
              {t("signUp")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero with parallax */}
      <section className="relative flex min-h-[92vh] items-center justify-center px-4 pt-24">
        <motion.div
          style={{ y: blobY }}
          className="absolute top-24 left-1/2 -z-[1] h-72 w-72 -translate-x-1/2 rounded-full bg-primary-glow/30 blur-3xl"
        />
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass mx-auto mb-6 w-fit rounded-full px-4 py-1.5 text-sm font-medium text-accent-foreground shadow-card"
          >
            ✨ {t("tagline")}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl font-extrabold tracking-tight text-balance sm:text-6xl"
          >
            <span className="gradient-text">{t("heroTitle")}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground"
          >
            {t("heroSubtitle")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="gradient-primary shadow-elegant rounded-full px-7 py-3.5 font-semibold text-primary-foreground transition-transform hover:scale-105"
            >
              {t("getStarted")}
            </Link>
            <a
              href="#features"
              className="glass rounded-full px-7 py-3.5 font-semibold text-foreground shadow-card transition-transform hover:scale-105"
            >
              {t("learnMore")}
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Features — parallax layer moving slower */}
      <motion.section id="features" style={{ y: cardY }} className="relative mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-5 sm:grid-cols-2">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="glass shadow-card group rounded-3xl p-7 transition-all hover:-translate-y-1 hover:shadow-elegant"
            >
              <div className="gradient-primary mb-4 grid h-12 w-12 place-items-center rounded-2xl text-primary-foreground transition-transform group-hover:scale-110 group-hover:rotate-6">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="gradient-primary shadow-elegant mt-16 rounded-[2rem] px-8 py-14 text-center text-primary-foreground"
        >
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t("landingCtaTitle")}</h2>
          <p className="mt-3 opacity-90">{t("landingCtaSubtitle")}</p>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="mt-8 inline-block rounded-full bg-card px-8 py-3.5 font-semibold text-primary shadow-card transition-transform hover:scale-105"
          >
            {t("getStarted")}
          </Link>
        </motion.div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          {t("appName")} © {new Date().getFullYear()}
        </p>
      </motion.section>
    </div>
  );
}
