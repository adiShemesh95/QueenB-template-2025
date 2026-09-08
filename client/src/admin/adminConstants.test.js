import {
  formatAdminDate,
  formatAdminDateTime,
  formatAdminTimeRange,
} from "./adminFormat";
import {
  ADMIN_CALENDAR_LEGEND_STATUSES,
  ADMIN_MATCHING_STATUSES,
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
});

describe("adminConstants", () => {
  test("exposes only the four current production statuses with readable labels", () => {
    expect(ADMIN_MATCHING_STATUSES).toEqual([
      "PENDING_MENTOR",
      "PENDING_MENTEE",
      "MATCHED",
      "REJECTED",
    ]);
    expect(getAdminStatusLabel("PENDING_MENTOR")).toBe(
      "Waiting for mentor times"
    );
    expect(getAdminStatusLabel("PENDING_MENTEE")).toBe(
      "Waiting for mentee selection"
    );
    expect(getAdminStatusLabel("MATCHED")).toBe("Matched");
    expect(getAdminStatusLabel("REJECTED")).toBe("Rejected");
  });

  test("calendar legend lists only statuses that can be scheduled events", () => {
    expect(ADMIN_CALENDAR_LEGEND_STATUSES).toEqual(["MATCHED"]);
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
    ]);
  });
});
