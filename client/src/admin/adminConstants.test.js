import {
  formatAdminDate,
  formatAdminDateTime,
  formatAdminTimeRange,
} from "./adminFormat";
import {
  ADMIN_MATCHING_STATUSES,
  getAdminStatusLabel,
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
});
