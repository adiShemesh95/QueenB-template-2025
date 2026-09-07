/**
 * Small Admin-local date formatters (browser Intl — no extra dependency).
 * Null/invalid dates return a safe placeholder, never "Invalid Date".
 */

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
});

const longDateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function toValidDate(value) {
  if (value == null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatAdminDate(value) {
  const date = toValidDate(value);
  if (!date) return "—";
  return dateFormatter.format(date);
}

export function formatAdminDateTime(value) {
  const date = toValidDate(value);
  if (!date) return "—";
  return dateTimeFormatter.format(date);
}

export function formatAdminTimeRange(start, end) {
  const startDate = toValidDate(start);
  if (!startDate) return "—";
  const datePart = dateFormatter.format(startDate);
  const startTime = timeFormatter.format(startDate);
  const endDate = toValidDate(end);
  if (!endDate) return `${datePart} · ${startTime}`;
  return `${datePart} · ${startTime} – ${timeFormatter.format(endDate)}`;
}

/** Long weekday date for Meeting Details, e.g. "Wednesday, 2 September 2026". */
export function formatAdminLongDate(value) {
  const date = toValidDate(value);
  if (!date) return "—";
  return longDateFormatter.format(date);
}

/** Clock range only, e.g. "10:00 – 11:00" (no date part). */
export function formatAdminClockRange(start, end) {
  const startDate = toValidDate(start);
  if (!startDate) return "—";
  const startTime = timeFormatter.format(startDate);
  const endDate = toValidDate(end);
  if (!endDate) return startTime;
  return `${startTime} – ${timeFormatter.format(endDate)}`;
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
