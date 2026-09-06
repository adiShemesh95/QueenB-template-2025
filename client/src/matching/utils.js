/**
 * Date/time helpers for the matching flow.
 * Kept tiny and package-free so they are easy to replace
 * with a shared formatter or library later if needed.
 */

const LOCALE_MAP = {
  en: "en-GB",
  he: "he-IL",
};

function getLocale(language = "en") {
  return LOCALE_MAP[language] || LOCALE_MAP.en;
}

function createFormatters(language) {
  const locale = getLocale(language);
  return {
    date: new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    dateTime: new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    time: new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

export function formatDate(isoString, language = "en") {
  if (!isoString) return "—";
  return createFormatters(language).date.format(new Date(isoString));
}

export function formatDateTime(isoString, language = "en") {
  if (!isoString) return "—";
  return createFormatters(language).dateTime.format(new Date(isoString));
}

export function formatTimeRange(startIso, endIso, language = "en") {
  if (!startIso) return "—";
  const formatters = createFormatters(language);
  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : null;
  const datePart = formatters.date.format(start);
  const startTime = formatters.time.format(start);
  const endTime = end ? formatters.time.format(end) : null;
  return endTime
    ? `${datePart} · ${startTime} – ${endTime}`
    : `${datePart} · ${startTime}`;
}
