import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import AdminMatchingDetailsPage from "./AdminMatchingDetailsPage";
import * as adminService from "./adminService";
import { MatchingLanguageProvider } from "../matching/MatchingLanguageContext";

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
    useParams: () => ({ id: "10" }),
  };
});

describe("AdminMatchingDetailsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  test("renders participants, selectedSlot, proposed slots, and feedback unavailable", async () => {
    adminService.getAdminMatchingById.mockResolvedValue({
      id: 10,
      status: "MATCHED",
      createdAt: "2026-02-01T09:00:00.000Z",
      updatedAt: "2026-02-02T09:00:00.000Z",
      moreTimesRequested: false,
      rescheduleUsed: false,
      mentor: {
        id: 1,
        username: "mentorA",
        email: "mentor@ex.com",
        mentorProfile: {
          job: "Engineer",
          company: "Acme",
          yearsExperience: 3,
          topics: ["Career Planning"],
          techStack: ["React"],
        },
      },
      mentee: {
        id: 2,
        username: "menteeB",
        email: "mentee@ex.com",
      },
      selectedSlot: {
        id: 5,
        start: "2026-03-10T14:00:00.000Z",
        end: "2026-03-10T15:00:00.000Z",
      },
      slots: [
        {
          id: 4,
          start: "2026-03-09T10:00:00.000Z",
          end: "2026-03-09T11:00:00.000Z",
          isSelected: false,
        },
        {
          id: 5,
          start: "2026-03-10T14:00:00.000Z",
          end: "2026-03-10T15:00:00.000Z",
          isSelected: true,
        },
      ],
      feedback: null,
    });

    render(
    <MatchingLanguageProvider>
      <AdminMatchingDetailsPage />
    </MatchingLanguageProvider>
  );

    expect(await screen.findByText("mentorA")).toBeInTheDocument();
    expect(screen.getByText("mentor@ex.com")).toBeInTheDocument();
    expect(screen.getByText("menteeB")).toBeInTheDocument();
    expect(screen.getByText("mentee@ex.com")).toBeInTheDocument();
    expect(screen.getByText("Engineer")).toBeInTheDocument();
    expect(screen.getByText("Selected")).toBeInTheDocument();
    expect(screen.getByText("More times requested")).toBeInTheDocument();
    expect(screen.getByText("Reschedule used")).toBeInTheDocument();
    expect(screen.getByText("Feedback is not available yet.")).toBeInTheDocument();
    expect(screen.queryByText(/no feedback submitted/i)).not.toBeInTheDocument();
  });

  test("shows Reschedule used Yes when rescheduleUsed is true", async () => {
    adminService.getAdminMatchingById.mockResolvedValue({
      id: 12,
      status: "PENDING_MENTOR",
      createdAt: "2026-02-01T09:00:00.000Z",
      updatedAt: "2026-02-03T09:00:00.000Z",
      moreTimesRequested: false,
      rescheduleUsed: true,
      mentor: {
        id: 1,
        username: "mentorA",
        email: "mentor@ex.com",
        mentorProfile: null,
      },
      mentee: {
        id: 2,
        username: "menteeB",
        email: "mentee@ex.com",
      },
      selectedSlot: null,
      slots: [],
      feedback: null,
    });

    render(
    <MatchingLanguageProvider>
      <AdminMatchingDetailsPage />
    </MatchingLanguageProvider>
  );

    expect(await screen.findByText("Reschedule used")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.queryByText("RESCHEDULED")).not.toBeInTheDocument();
  });

  test("shows no selected meeting time when selectedSlot is null", async () => {
    adminService.getAdminMatchingById.mockResolvedValue({
      id: 11,
      status: "PENDING_MENTEE",
      createdAt: "2026-02-01T09:00:00.000Z",
      updatedAt: "2026-02-01T09:00:00.000Z",
      moreTimesRequested: true,
      rescheduleUsed: false,
      mentor: {
        id: 1,
        username: "mentorA",
        email: "mentor@ex.com",
        mentorProfile: null,
      },
      mentee: {
        id: 2,
        username: "menteeB",
        email: "mentee@ex.com",
      },
      selectedSlot: null,
      slots: [
        {
          id: 8,
          start: "2026-03-09T10:00:00.000Z",
          end: "2026-03-09T11:00:00.000Z",
          isSelected: false,
        },
      ],
      feedback: null,
    });

    render(
    <MatchingLanguageProvider>
      <AdminMatchingDetailsPage />
    </MatchingLanguageProvider>
  );

    expect(
      await screen.findByText(/no meeting time selected yet/i)
    ).toBeInTheDocument();
    expect(screen.getByText("No mentor profile")).toBeInTheDocument();
    expect(screen.queryByText("Selected")).not.toBeInTheDocument();
  });

  test("shows not found when API returns null", async () => {
    adminService.getAdminMatchingById.mockResolvedValue(null);
    render(
    <MatchingLanguageProvider>
      <AdminMatchingDetailsPage />
    </MatchingLanguageProvider>
  );
    expect(await screen.findByText(/matching not found/i)).toBeInTheDocument();
  });

  test("Arabic UI uses polished reschedule-used wording", async () => {
    window.localStorage.setItem("queenb-matching-language", "ar");
    adminService.getAdminMatchingById.mockResolvedValue({
      id: 10,
      status: "MATCHED",
      createdAt: "2026-02-01T09:00:00.000Z",
      updatedAt: "2026-02-02T09:00:00.000Z",
      moreTimesRequested: false,
      rescheduleUsed: true,
      mentor: { id: 1, username: "mentorA", email: "mentor@ex.com" },
      mentee: { id: 2, username: "menteeB", email: "mentee@ex.com" },
      mentorProfile: null,
      selectedSlot: null,
      slots: [],
      feedback: null,
    });

    render(
      <MatchingLanguageProvider>
        <AdminMatchingDetailsPage />
      </MatchingLanguageProvider>
    );

    expect(
      await screen.findByText("تم استخدام إعادة الجدولة")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("استُخدمت إعادة الجدولة")
    ).not.toBeInTheDocument();
  });

  test("back arrow mirrors for Arabic RTL and still links to matchings list", async () => {
    window.localStorage.setItem("queenb-matching-language", "ar");
    adminService.getAdminMatchingById.mockResolvedValue({
      id: 10,
      status: "MATCHED",
      createdAt: "2026-02-01T09:00:00.000Z",
      updatedAt: "2026-02-02T09:00:00.000Z",
      moreTimesRequested: false,
      rescheduleUsed: false,
      mentor: { id: 1, username: "mentorA", email: "mentor@ex.com" },
      mentee: { id: 2, username: "menteeB", email: "mentee@ex.com" },
      mentorProfile: null,
      selectedSlot: null,
      slots: [],
      feedback: null,
    });

    render(
      <MatchingLanguageProvider>
        <AdminMatchingDetailsPage />
      </MatchingLanguageProvider>
    );

    const backLink = await screen.findByRole("link", {
      name: /العودة إلى المطابقات|Back to matchings/i,
    });
    expect(backLink).toHaveAttribute("href", "/admin/matchings");
    const arrow = backLink.querySelector("svg");
    expect(arrow).toHaveStyle({ transform: "scaleX(-1)" });
  });
});
