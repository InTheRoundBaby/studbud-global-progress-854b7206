import { format as formatGregorian } from "date-fns";
import { format as formatJalali } from "date-fns-jalali";
import type { CalendarType, Language } from "./i18n";

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

export function localizeNumber(n: string | number, language: Language): string {
  return language === "fa" ? toFaDigits(n) : String(n);
}

const JALALI_MONTHS_FA = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

const GREGORIAN_MONTHS_FA = [
  "ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن",
  "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر",
];

/** Format a date according to the user's calendar & language preference. */
export function formatDate(
  date: Date | string,
  calendar: CalendarType,
  language: Language,
  withTime = false,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";

  if (calendar === "jalali") {
    const day = formatJalali(d, "d");
    const monthIdx = Number(formatJalali(d, "M")) - 1;
    const year = formatJalali(d, "yyyy");
    const time = withTime ? ` — ${formatJalali(d, "HH:mm")}` : "";
    const str = `${day} ${JALALI_MONTHS_FA[monthIdx] ?? ""} ${year}${time}`;
    return language === "fa" ? toFaDigits(str) : str;
  }

  if (language === "fa") {
    const day = formatGregorian(d, "d");
    const monthIdx = d.getMonth();
    const year = formatGregorian(d, "yyyy");
    const time = withTime ? ` — ${formatGregorian(d, "HH:mm")}` : "";
    return toFaDigits(`${day} ${GREGORIAN_MONTHS_FA[monthIdx]} ${year}${time}`);
  }

  return formatGregorian(d, withTime ? "MMM d, yyyy — HH:mm" : "MMM d, yyyy");
}