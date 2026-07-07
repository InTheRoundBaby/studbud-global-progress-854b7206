import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

async function persistPref(patch: { language?: string; calendar?: string }) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("profiles").update(patch).eq("id", data.user.id);
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useI18n();

  const toggle = (lang: "en" | "fa") => {
    setLanguage(lang);
    void persistPref({ language: lang });
  };

  return (
    <div className="glass flex items-center rounded-full p-1 shadow-card" role="group" aria-label="Language">
      <button
        onClick={() => toggle("en")}
        className={`rounded-full px-3 py-1 text-sm font-semibold transition-all ${
          language === "en" ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => toggle("fa")}
        className={`rounded-full px-3 py-1 text-sm font-semibold transition-all ${
          language === "fa" ? "gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        فا
      </button>
      {!compact && <span className="sr-only">Language switcher</span>}
    </div>
  );
}

export function CalendarSwitcher() {
  const { calendar, setCalendar, t } = useI18n();

  const toggle = (cal: "gregorian" | "jalali") => {
    setCalendar(cal);
    void persistPref({ calendar: cal });
  };

  return (
    <div className="glass flex items-center rounded-full p-1 shadow-card" role="group" aria-label="Calendar">
      <button
        onClick={() => toggle("gregorian")}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
          calendar === "gregorian"
            ? "gradient-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {t("gregorian")}
      </button>
      <button
        onClick={() => toggle("jalali")}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
          calendar === "jalali"
            ? "gradient-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {t("jalali")}
      </button>
    </div>
  );
}