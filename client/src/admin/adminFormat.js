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
