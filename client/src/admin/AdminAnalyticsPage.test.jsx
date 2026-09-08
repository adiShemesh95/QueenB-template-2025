import React from "react";
import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
import AdminAnalyticsPage from "./AdminAnalyticsPage";
import { MatchingLanguageProvider } from "../matching/MatchingLanguageContext";
import { getAdminAnalytics } from "./adminService";

jest.mock("./adminService", () => ({
  getAdminAnalytics: jest.fn(),
}));

function renderPage() {
  return render(
    <MatchingLanguageProvider>
      <AdminAnalyticsPage />
    </MatchingLanguageProvider>
  );
}

const emptyAnalytics = {
  kpis: {
    profileViews: 0,
    mentoringRequests: 0,
    slotsSelected: 0,
    successfulMatches: 0,
    conversionRate: 0,
  },
  funnel: [
    {
      eventType: "mentor_profile_viewed",
      key: "profileViews",
      label: "Profile Views",
      count: 0,
      percentageOfViews: 0,
    },
    {
      eventType: "mentoring_request_sent",
      key: "mentoringRequests",
      label: "Mentoring Requests",
      count: 0,
      percentageOfViews: 0,
    },
    {
      eventType: "slot_selected",
      key: "slotsSelected",
      label: "Slots Selected",
      count: 0,
      percentageOfViews: 0,
    },
    {
      eventType: "match_confirmed",
      key: "successfulMatches",
      label: "Successful Matches",
      count: 0,
      percentageOfViews: 0,
    },
  ],
  funnelConversions: {
    requestRateFromViews: 0,
    slotRateFromRequests: 0,
    matchRateFromSlots: 0,
  },
  sources: [
    {
      source: "whatsapp",
      profileViews: 0,
      mentoringRequests: 0,
      slotsSelected: 0,
      successfulMatches: 0,
      conversionRate: 0,
    },
    {
      source: "linkedin",
      profileViews: 0,
      mentoringRequests: 0,
      slotsSelected: 0,
      successfulMatches: 0,
      conversionRate: 0,
    },
    {
      source: "copy_link",
      profileViews: 0,
      mentoringRequests: 0,
      slotsSelected: 0,
      successfulMatches: 0,
      conversionRate: 0,
    },
    {
      source: "direct",
      profileViews: 0,
      mentoringRequests: 0,
      slotsSelected: 0,
      successfulMatches: 0,
      conversionRate: 0,
    },
  ],
  matchesOverTime: [],
};

describe("AdminAnalyticsPage", () => {
  beforeEach(() => {
    getAdminAnalytics.mockReset();
  });

  test("loads real API KPIs and shows empty trend state", async () => {
    getAdminAnalytics.mockResolvedValue(emptyAnalytics);

    renderPage();

    expect(screen.getByText(/loading analytics/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/mentor profile views/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: /^analytics$/i })).toBeInTheDocument();
    expect(screen.getByText(/no successful matches recorded yet/i)).toBeInTheDocument();
    expect(getAdminAnalytics).toHaveBeenCalled();
  });

  test("trend chart shows DD/MM date labels and match counts", async () => {
    getAdminAnalytics.mockResolvedValue({
      ...emptyAnalytics,
      kpis: {
        ...emptyAnalytics.kpis,
        successfulMatches: 3,
        conversionRate: 0,
      },
      matchesOverTime: [
        { date: "2026-09-08", successfulMatches: 2 },
        { date: "2026-09-09", successfulMatches: 1 },
      ],
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("08/09")).toBeInTheDocument();
    });
    expect(screen.getByText("09/09")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(
      screen.queryByText(/no successful matches recorded yet/i)
    ).not.toBeInTheDocument();
  });

  test("shows non-destructive error when the API fails", async () => {
    getAdminAnalytics.mockRejectedValue(new Error("network"));

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/could not load analytics/i)
      ).toBeInTheDocument();
    });
  });

  test("auto-refreshes and clears the interval on unmount", async () => {
    jest.useFakeTimers();
    getAdminAnalytics.mockResolvedValue(emptyAnalytics);

    const { unmount } = renderPage();

    await waitFor(() => expect(getAdminAnalytics).toHaveBeenCalledTimes(1));

    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    await waitFor(() => expect(getAdminAnalytics).toHaveBeenCalledTimes(2));

    unmount();

    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    expect(getAdminAnalytics).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });
});
