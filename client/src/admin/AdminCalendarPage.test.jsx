import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminCalendarPage from "./AdminCalendarPage";
import * as adminService from "./adminService";
import {
  ADMIN_MATCHING_STATUSES,
  ADMIN_STATUS_LABELS,
  toAdminCalendarEvents,
} from "./adminConstants";
import {
  formatAdminClockRange,
  formatAdminDuration,
  formatAdminLongDate,
} from "./adminFormat";

jest.mock("./adminService");

jest.mock("react-router-dom", () => {
  const React = require("react");
  const MockLink = React.forwardRef(function MockLink(
    { children, to, ...props },
    ref
  ) {
    return React.createElement("a", { href: to, ref, ...props }, children);
  });
  return {
    Link: MockLink,
  };
});

function slotAroundNow() {
  const start = new Date();
  start.setHours(14, 0, 0, 0);
  const end = new Date(start);
  end.setHours(15, 0, 0, 0);
  return {
    id: 9,
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

const scheduledMatching = {
  id: 43,
  status: "MATCHED",
  createdAt: "2026-02-02T09:00:00.000Z",
  updatedAt: "2026-02-02T10:00:00.000Z",
  mentor: { id: 1, username: "mentorA", email: "a@ex.com" },
  mentee: { id: 3, username: "menteeC", email: "c@ex.com" },
  selectedSlot: slotAroundNow(),
};

const unscheduledMatching = {
  id: 42,
  status: "PENDING_MENTOR",
  createdAt: "2026-02-01T09:00:00.000Z",
  updatedAt: "2026-02-01T09:00:00.000Z",
  mentor: { id: 1, username: "mentorA", email: "a@ex.com" },
  mentee: { id: 2, username: "menteeB", email: "b@ex.com" },
  selectedSlot: null,
};

describe("toAdminCalendarEvents", () => {
  test("converts only matchings with selectedSlot into events", () => {
    const events = toAdminCalendarEvents([
      unscheduledMatching,
      scheduledMatching,
    ]);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: 43,
      status: "MATCHED",
      title: "mentorA ↔ menteeC",
      start: scheduledMatching.selectedSlot.start,
      mentor: scheduledMatching.mentor,
      mentee: scheduledMatching.mentee,
    });
  });

  test("does not invent future lifecycle statuses", () => {
    expect(ADMIN_MATCHING_STATUSES).toEqual([
      "PENDING_MENTOR",
      "PENDING_MENTEE",
      "MATCHED",
      "REJECTED",
    ]);
    expect(ADMIN_STATUS_LABELS).not.toHaveProperty("ATTENDANCE_CONFIRMED");
    expect(ADMIN_STATUS_LABELS).not.toHaveProperty("HAPPENED");
    expect(ADMIN_STATUS_LABELS).not.toHaveProperty("DID_NOT_HAPPEN");
    expect(ADMIN_STATUS_LABELS).not.toHaveProperty("FEEDBACK_COMPLETED");
  });
});

describe("AdminCalendarPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("calendar grid renders even with zero scheduled meetings", async () => {
    adminService.getAdminMatchings.mockResolvedValue([unscheduledMatching]);

    render(<AdminCalendarPage />);

    expect(
      await screen.findByRole("grid", { name: /calendar for/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("Sat")).toBeInTheDocument();
    expect(
      screen.getByText(/no scheduled meetings this month/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/no scheduled meetings yet/i)
    ).not.toBeInTheDocument();
  });

  test("empty data does not replace or hide the calendar", async () => {
    adminService.getAdminMatchings.mockResolvedValue([]);

    render(<AdminCalendarPage />);

    const grid = await screen.findByRole("grid", { name: /calendar for/i });
    expect(grid).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /\d{4}/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /go to current month/i })
    ).toBeInTheDocument();
  });

  test("Meeting Details panel is always visible with empty state", async () => {
    adminService.getAdminMatchings.mockResolvedValue([]);

    render(<AdminCalendarPage />);

    expect(
      await screen.findByRole("heading", { name: /meeting details/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/no meeting selected/i)).toBeInTheDocument();
    expect(
      screen.getByText(/click on a meeting in the calendar/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/meeting details/i)).toBeInTheDocument();
  });

  test("matching without selectedSlot does not render as an event", async () => {
    adminService.getAdminMatchings.mockResolvedValue([
      unscheduledMatching,
      scheduledMatching,
    ]);

    render(<AdminCalendarPage />);

    expect(
      await screen.findByRole("button", { name: /mentorA ↔ menteeC/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /menteeB/i })
    ).not.toBeInTheDocument();
  });

  test("event shows mentor ↔ mentee, time range, and status", async () => {
    adminService.getAdminMatchings.mockResolvedValue([scheduledMatching]);

    render(<AdminCalendarPage />);

    const eventButton = await screen.findByRole("button", {
      name: /mentorA ↔ menteeC/i,
    });
    expect(eventButton).toHaveTextContent("mentorA ↔ menteeC");
    expect(eventButton).toHaveTextContent(
      formatAdminClockRange(
        scheduledMatching.selectedSlot.start,
        scheduledMatching.selectedSlot.end
      )
    );
    expect(eventButton.getAttribute("aria-label")).toMatch(/Matched/i);

    const legend = screen.getByLabelText(/status color legend/i);
    expect(within(legend).getByText("Matched")).toBeInTheDocument();
    expect(
      within(legend).getByText("Waiting for mentee selection")
    ).toBeInTheDocument();
  });

  test("clicking event opens Meeting Details panel without navigating away", async () => {
    adminService.getAdminMatchings.mockResolvedValue([scheduledMatching]);

    render(<AdminCalendarPage />);

    expect(await screen.findByText(/no meeting selected/i)).toBeInTheDocument();

    const eventButton = await screen.findByRole("button", {
      name: /mentorA ↔ menteeC/i,
    });
    expect(eventButton.tagName).toBe("BUTTON");
    expect(eventButton).not.toHaveAttribute("href");

    await userEvent.click(eventButton);

    expect(await screen.findByText("a@ex.com")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /view full details/i })
    ).toBeInTheDocument();
    expect(screen.queryByText(/no meeting selected/i)).not.toBeInTheDocument();
    expect(screen.getByRole("grid", { name: /calendar for/i })).toBeInTheDocument();
  });

  test("panel shows mentor, mentee, date, time, and status", async () => {
    adminService.getAdminMatchings.mockResolvedValue([scheduledMatching]);

    render(<AdminCalendarPage />);

    await userEvent.click(
      await screen.findByRole("button", { name: /mentorA ↔ menteeC/i })
    );

    const panelHeading = await screen.findByRole("heading", {
      name: /meeting details/i,
    });
    const panel = panelHeading.closest("aside") || panelHeading.parentElement;

    expect(within(panel).getByText("a@ex.com")).toBeInTheDocument();
    expect(within(panel).getByText("c@ex.com")).toBeInTheDocument();
    expect(
      within(panel).getByText(
        formatAdminLongDate(scheduledMatching.selectedSlot.start)
      )
    ).toBeInTheDocument();
    expect(
      within(panel).getByText(
        formatAdminClockRange(
          scheduledMatching.selectedSlot.start,
          scheduledMatching.selectedSlot.end
        )
      )
    ).toBeInTheDocument();

    const duration = formatAdminDuration(
      scheduledMatching.selectedSlot.start,
      scheduledMatching.selectedSlot.end
    );
    if (duration) {
      expect(within(panel).getByText(`(${duration})`)).toBeInTheDocument();
    }

    expect(within(panel).getAllByText("Matched").length).toBeGreaterThan(0);
    expect(within(panel).getByText("Mentor")).toBeInTheDocument();
    expect(within(panel).getByText("Mentee")).toBeInTheDocument();
  });

  test("close button returns panel to empty state without hiding it", async () => {
    adminService.getAdminMatchings.mockResolvedValue([scheduledMatching]);

    render(<AdminCalendarPage />);

    await userEvent.click(
      await screen.findByRole("button", { name: /mentorA ↔ menteeC/i })
    );
    expect(await screen.findByText("a@ex.com")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /close meeting details/i })
    );

    await waitFor(() => {
      expect(screen.getByText(/no meeting selected/i)).toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", { name: /meeting details/i })
    ).toBeInTheDocument();
    expect(screen.queryByText("a@ex.com")).not.toBeInTheDocument();
  });

  test("View full details navigates to /admin/matchings/:id", async () => {
    adminService.getAdminMatchings.mockResolvedValue([scheduledMatching]);

    render(<AdminCalendarPage />);

    await userEvent.click(
      await screen.findByRole("button", { name: /mentorA ↔ menteeC/i })
    );

    const detailsLink = await screen.findByRole("link", {
      name: /view full details/i,
    });
    expect(detailsLink).toHaveAttribute("href", "/admin/matchings/43");
  });

  test("does not fetch matching detail on event click", async () => {
    adminService.getAdminMatchings.mockResolvedValue([scheduledMatching]);
    adminService.getAdminMatchingById = jest.fn();

    render(<AdminCalendarPage />);

    await userEvent.click(
      await screen.findByRole("button", { name: /mentorA ↔ menteeC/i })
    );
    await screen.findByRole("heading", { name: /meeting details/i });

    expect(adminService.getAdminMatchingById).not.toHaveBeenCalled();
    expect(adminService.getAdminMatchings).toHaveBeenCalledTimes(1);
  });

  test("shows friendly error state while still keeping layout usable", async () => {
    adminService.getAdminMatchings.mockRejectedValue(new Error("network"));

    render(<AdminCalendarPage />);

    expect(
      await screen.findByText(/could not load calendar meetings/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/network/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("grid", { name: /calendar for/i })
    ).toBeInTheDocument();
  });

  test("month navigation previous, next, and today work", async () => {
    adminService.getAdminMatchings.mockResolvedValue([scheduledMatching]);

    render(<AdminCalendarPage />);
    await screen.findByRole("button", { name: /mentorA ↔ menteeC/i });

    const monthHeading = screen.getByRole("heading", {
      level: 2,
      name: /\d{4}/,
    });
    const initialLabel = monthHeading.textContent;

    await userEvent.click(
      screen.getByRole("button", { name: /next month/i })
    );
    expect(monthHeading.textContent).not.toBe(initialLabel);

    await userEvent.click(
      screen.getByRole("button", { name: /previous month/i })
    );
    expect(monthHeading.textContent).toBe(initialLabel);

    await userEvent.click(
      screen.getByRole("button", { name: /next month/i })
    );
    await userEvent.click(
      screen.getByRole("button", { name: /go to current month/i })
    );
    expect(monthHeading.textContent).toBe(initialLabel);
  });
});

describe("AdminCalendarPage today highlight", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Fixed "today" for deterministic full-date comparison (local): 15 Sep 2026.
    jest.setSystemTime(new Date(2026, 8, 15, 12, 0, 0));
    adminService.getAdminMatchings.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("highlights only the real current date (year + month + day)", async () => {
    render(<AdminCalendarPage />);

    expect(
      await screen.findByRole("heading", { level: 2, name: /september 2026/i })
    ).toBeInTheDocument();

    const todayCell = screen.getByRole("gridcell", { name: /Sep 15 2026/i });
    expect(todayCell).toHaveAttribute("aria-current", "date");

    const otherDaySameMonth = screen.getByRole("gridcell", {
      name: /Sep 08 2026/i,
    });
    expect(otherDaySameMonth).not.toHaveAttribute("aria-current");
  });

  test("same day number in another month is not highlighted", async () => {
    render(<AdminCalendarPage />);
    await screen.findByRole("heading", { level: 2, name: /september 2026/i });

    fireEvent.click(screen.getByRole("button", { name: /next month/i }));

    expect(
      screen.getByRole("heading", { level: 2, name: /october 2026/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole("gridcell", { current: "date" })).toBeNull();

    const oct15 = screen.getByRole("gridcell", { name: /Oct 15 2026/i });
    expect(oct15).not.toHaveAttribute("aria-current");
  });

  test("Today button returns to the current month with today highlighted", async () => {
    render(<AdminCalendarPage />);
    await screen.findByRole("heading", { level: 2, name: /september 2026/i });

    fireEvent.click(screen.getByRole("button", { name: /next month/i }));
    fireEvent.click(screen.getByRole("button", { name: /next month/i }));
    expect(
      screen.getByRole("heading", { level: 2, name: /november 2026/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole("gridcell", { current: "date" })).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: /go to current month/i })
    );

    expect(
      screen.getByRole("heading", { level: 2, name: /september 2026/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("gridcell", { name: /Sep 15 2026/i })
    ).toHaveAttribute("aria-current", "date");
  });
});
