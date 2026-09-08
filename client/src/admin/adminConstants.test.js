import {
  formatAdminDate,
  formatAdminDateTime,
  formatAdminTimeRange,
} from "./adminFormat";
import {
  ADMIN_CALENDAR_LEGEND_STATUSES,
  ADMIN_MATCHING_STATUSES,
  ADMIN_STATUS_COLORS,
  ADMIN_STATUS_FILTER_OPTIONS,
  getAdminStatusColors,
  getAdminStatusLabel,
  toAdminCalendarEvents,
} from "./adminConstants";

describe("adminFormat", () => {
  test("handles null and invalid dates safely", () => {
    expect(formatAdminDate(null)).toBe("—");
    expect(formatAdminDateTime(undefined)).toBe("—");
    expect(formatAdminTimeRange("not-a-date", null)).toBe("—");
    expect(formatAdminDateTime("Invalid Date")).toBe("—");
  });

  test("formats Arabic dates with the ar locale (not English month names)", () => {
    const iso = new Date(2026, 8, 8, 14, 47).toISOString();
    const arabic = formatAdminDateTime(iso, "ar");
    const english = formatAdminDateTime(iso, "en");

    expect(english).toMatch(/Sep/);
    expect(arabic).not.toMatch(/\bSep\b/);
    expect(arabic).toMatch(/سبتمبر/);
  });
});

describe("adminConstants", () => {
  test("exposes current production statuses with readable labels", () => {
    expect(ADMIN_MATCHING_STATUSES).toEqual([
      "PENDING_MENTOR",
      "PENDING_MENTEE",
      "MATCHED",
      "CANCELLED",
      "REJECTED",
    ]);
    expect(getAdminStatusLabel("PENDING_MENTOR")).toBe(
      "Waiting for mentor times"
    );
    expect(getAdminStatusLabel("PENDING_MENTEE")).toBe(
      "Waiting for mentee selection"
    );
    expect(getAdminStatusLabel("MATCHED")).toBe("Matched");
    expect(getAdminStatusLabel("CANCELLED")).toBe("Cancelled");
    expect(getAdminStatusLabel("REJECTED")).toBe("Rejected");
  });

  test("calendar legend lists MATCHED and CANCELLED scheduled statuses", () => {
    expect(ADMIN_CALENDAR_LEGEND_STATUSES).toEqual(["MATCHED", "CANCELLED"]);
  });

  test("CANCELLED uses a dedicated red Admin color mapping", () => {
    expect(ADMIN_STATUS_COLORS.CANCELLED).toEqual({
      bg: "rgba(229, 62, 62, 0.18)",
      color: "#9B2C2C",
      border: "#E53E3E",
      dot: "#E53E3E",
    });
    expect(getAdminStatusColors("CANCELLED")).toEqual(
      ADMIN_STATUS_COLORS.CANCELLED
    );
    expect(getAdminStatusColors("MATCHED")).toEqual(ADMIN_STATUS_COLORS.MATCHED);
  });

  test("Admin report filter options include CANCELLED", () => {
    expect(
      ADMIN_STATUS_FILTER_OPTIONS.some((option) => option.value === "CANCELLED")
    ).toBe(true);
  });

  test("toAdminCalendarEvents skips matchings without selectedSlot", () => {
    const events = toAdminCalendarEvents([
      {
        id: 1,
        status: "PENDING_MENTOR",
        mentor: { username: "a" },
        mentee: { username: "b" },
        selectedSlot: null,
      },
      {
        id: 2,
        status: "MATCHED",
        mentor: { username: "c" },
        mentee: { username: "d" },
        selectedSlot: {
          id: 9,
          start: "2026-03-01T14:00:00.000Z",
          end: "2026-03-01T15:00:00.000Z",
        },
      },
      {
        id: 3,
        status: "CANCELLED",
        mentor: { username: "e" },
        mentee: { username: "f" },
        selectedSlot: {
          id: 10,
          start: "2026-03-02T14:00:00.000Z",
          end: "2026-03-02T15:00:00.000Z",
        },
      },
    ]);
    expect(events).toEqual([
      {
        id: 2,
        status: "MATCHED",
        title: "c ↔ d",
        start: "2026-03-01T14:00:00.000Z",
        end: "2026-03-01T15:00:00.000Z",
        mentor: { username: "c" },
        mentee: { username: "d" },
      },
      {
        id: 3,
        status: "CANCELLED",
        title: "e ↔ f",
        start: "2026-03-02T14:00:00.000Z",
        end: "2026-03-02T15:00:00.000Z",
        mentor: { username: "e" },
        mentee: { username: "f" },
      },
    ]);
  });
});
