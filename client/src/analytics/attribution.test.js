import {
  buildLinkedInShareUrl,
  buildMentorShareUrl,
  buildWhatsAppShareUrl,
  normalizeAttributionSource,
  persistMentorAttribution,
  readMentorAttribution,
  hasTrackedMentorProfileView,
  markMentorProfileViewTracked,
} from "./attribution";

describe("analytics attribution helpers", () => {
  const originalOrigin = window.location.origin;

  beforeEach(() => {
    sessionStorage.clear();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: "https://queensmatch.example" },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: originalOrigin },
    });
  });

  test("WhatsApp link contains mentor ID and whatsapp source", () => {
    const url = buildWhatsAppShareUrl(42, "Check this mentor");
    expect(url).toContain("wa.me");
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain("/mentors/42?source=whatsapp");
  });

  test("LinkedIn link contains linkedin source", () => {
    const url = buildLinkedInShareUrl(9);
    expect(url).toContain("linkedin.com");
    expect(decodeURIComponent(url)).toContain("/mentors/9?source=linkedin");
  });

  test("Copy link URL uses copy_link source", () => {
    expect(buildMentorShareUrl(3, "copy_link")).toBe(
      "https://queensmatch.example/mentors/3?source=copy_link"
    );
  });

  test("invalid source falls back to direct", () => {
    expect(normalizeAttributionSource("twitter")).toBe("direct");
    expect(normalizeAttributionSource("")).toBe("direct");
    expect(normalizeAttributionSource(null)).toBe("direct");
  });

  test("direct navigation uses direct", () => {
    expect(normalizeAttributionSource("direct")).toBe("direct");
    persistMentorAttribution(5, undefined);
    expect(readMentorAttribution(5)).toBe("direct");
  });

  test("attribution is scoped per mentor profile id", () => {
    persistMentorAttribution(1, "whatsapp");
    persistMentorAttribution(2, "linkedin");
    expect(readMentorAttribution(1)).toBe("whatsapp");
    expect(readMentorAttribution(2)).toBe("linkedin");
  });

  test("view tracking guard is per mentor + source", () => {
    expect(hasTrackedMentorProfileView(1, "whatsapp")).toBe(false);
    markMentorProfileViewTracked(1, "whatsapp");
    expect(hasTrackedMentorProfileView(1, "whatsapp")).toBe(true);
    expect(hasTrackedMentorProfileView(1, "linkedin")).toBe(false);
    expect(hasTrackedMentorProfileView(2, "whatsapp")).toBe(false);
  });
});
