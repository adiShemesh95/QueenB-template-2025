/**
 * Small Admin-local date formatters (browser Intl — no extra dependency).
 * Null/invalid dates return a safe placeholder, never "Invalid Date".
 * Locale map aligns with matching/utils (en-GB / he-IL / ar).
 */

const LOCALE_MAP = {
  en: "en-GB",
  he: "he-IL",
  ar: "ar",
};

function getLocale(language = "en") {
  return LOCALE_MAP[language] || LOCALE_MAP.en;
}

function createFormatters(language = "en") {
  const locale = getLocale(language);
  return {
    dateTime: new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    date: new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }),
    longDate: new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}

function toValidDate(value) {
  if (value == null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatAdminDate(value, language = "en") {
  const date = toValidDate(value);
  if (!date) return "—";
  return createFormatters(language).date.format(date);
}

export function formatAdminDateTime(value, language = "en") {
  const date = toValidDate(value);
  if (!date) return "—";
  return createFormatters(language).dateTime.format(date);
}

export function formatAdminTimeRange(start, end, language = "en") {
  const startDate = toValidDate(start);
  if (!startDate) return "—";
  const formatters = createFormatters(language);
  const datePart = formatters.date.format(startDate);
  const startTime = formatters.time.format(startDate);
  const endDate = toValidDate(end);
  if (!endDate) return `${datePart} · ${startTime}`;
  return `${datePart} · ${startTime} – ${formatters.time.format(endDate)}`;
}

/** Long weekday date for Meeting Details, e.g. "Wednesday, 2 September 2026". */
export function formatAdminLongDate(value, language = "en") {
  const date = toValidDate(value);
  if (!date) return "—";
  return createFormatters(language).longDate.format(date);
}

/** Clock range only, e.g. "10:00 – 11:00" (no date part). */
export function formatAdminClockRange(start, end, language = "en") {
  const startDate = toValidDate(start);
  if (!startDate) return "—";
  const formatters = createFormatters(language);
  const startTime = formatters.time.format(startDate);
  const endDate = toValidDate(end);
  if (!endDate) return startTime;
  return `${startTime} – ${formatters.time.format(endDate)}`;
}

/**
 * Human duration from start/end when both are valid.
 * Returns null when duration cannot be calculated safely.
 */
export function formatAdminDuration(start, end) {
  const startDate = toValidDate(start);
  const endDate = toValidDate(end);
  if (!startDate || !endDate) return null;
  const minutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (rem === 0) return hours === 1 ? "1 hour" : `${hours} hours`;
  return `${hours}h ${rem}m`;
}
