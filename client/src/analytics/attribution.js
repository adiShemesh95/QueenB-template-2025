const ALLOWED_SOURCES = ["whatsapp", "linkedin", "copy_link", "direct"];

const ATTRIBUTION_PREFIX = "qm_analytics:attribution:v1:";
const VIEWED_PREFIX = "qm_analytics:viewed:v1:";

export function normalizeAttributionSource(raw) {
  if (raw == null || String(raw).trim() === "") {
    return "direct";
  }
  const value = String(raw).trim();
  return ALLOWED_SOURCES.includes(value) ? value : "direct";
}

export function buildMentorShareUrl(mentorProfileId, source) {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "";
  const safeSource = normalizeAttributionSource(source);
  return `${origin}/mentors/${mentorProfileId}?source=${encodeURIComponent(safeSource)}`;
}

export function buildWhatsAppShareUrl(mentorProfileId, shareText) {
  const url = buildMentorShareUrl(mentorProfileId, "whatsapp");
  const text = `${shareText} ${url}`.trim();
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildLinkedInShareUrl(mentorProfileId) {
  const url = buildMentorShareUrl(mentorProfileId, "linkedin");
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

export function persistMentorAttribution(mentorProfileId, source) {
  if (mentorProfileId == null) return;
  const key = `${ATTRIBUTION_PREFIX}${mentorProfileId}`;
  const payload = {
    source: normalizeAttributionSource(source),
    mentorProfileId: String(mentorProfileId),
  };
  try {
    sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export function readMentorAttribution(mentorProfileId) {
  if (mentorProfileId == null) return "direct";
  const key = `${ATTRIBUTION_PREFIX}${mentorProfileId}`;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return "direct";
    const parsed = JSON.parse(raw);
    if (String(parsed?.mentorProfileId) !== String(mentorProfileId)) {
      return "direct";
    }
    return normalizeAttributionSource(parsed?.source);
  } catch {
    return "direct";
  }
}

export function hasTrackedMentorProfileView(mentorProfileId, source) {
  const key = `${VIEWED_PREFIX}${mentorProfileId}:${normalizeAttributionSource(source)}`;
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function markMentorProfileViewTracked(mentorProfileId, source) {
  const key = `${VIEWED_PREFIX}${mentorProfileId}:${normalizeAttributionSource(source)}`;
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    // ignore
  }
}

export { ALLOWED_SOURCES };
