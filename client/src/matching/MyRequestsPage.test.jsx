import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MyRequestsPage from "./MyRequestsPage";
import { MatchingLanguageProvider } from "./MatchingLanguageContext";
import * as matchingService from "./matchingService";
import { REQUEST_STATUS } from "./constants";

jest.mock("./matchingService", () => ({
  getRequests: jest.fn(),
}));

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, username: "menteeUser", isAdmin: false },
    logout: jest.fn(),
  }),
}));

jest.mock("../components/Logo", () => {
  const React = require("react");
  return function MockLogo() {
    return React.createElement("div", null, "Queens Match");
  };
});

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
    useLocation: () => ({ pathname: "/my-requests" }),
    useNavigate: () => jest.fn(),
  };
});

const sampleRequests = [
  {
    id: 10,
    status: REQUEST_STATUS.PENDING_MENTOR,
    requestedAt: "2026-03-01T10:00:00.000Z",
    mentor: { id: 2, name: "Mentor Ava", avatarUrl: null },
    suggestedSlots: [],
    selectedSlot: null,
    meetingAt: null,
    moreTimesRequested: false,
    rescheduleUsed: false,
  },
  {
    id: 11,
    status: REQUEST_STATUS.MATCHED,
    requestedAt: "2026-03-02T10:00:00.000Z",
    mentor: { id: 3, name: "Mentor Bea", avatarUrl: null },
    suggestedSlots: [],
    selectedSlot: {
      id: 5,
      start: "2026-03-10T14:00:00.000Z",
      end: "2026-03-10T15:00:00.000Z",
    },
    meetingAt: "2026-03-10T14:00:00.000Z",
    moreTimesRequested: false,
    rescheduleUsed: false,
  },
];

function renderPage() {
  return render(
    <MatchingLanguageProvider>
      <MyRequestsPage />
    </MatchingLanguageProvider>
  );
}

describe("MyRequestsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.setItem("queenb-matching-language", "en");
  });

  test("loads requests and links to request details", async () => {
    matchingService.getRequests.mockResolvedValue(sampleRequests);
    renderPage();

    expect(await screen.findByText("Mentor Ava")).toBeInTheDocument();
    expect(screen.getByText("Mentor Bea")).toBeInTheDocument();

    const links = screen.getAllByRole("link", { name: /view request/i });
    expect(links[0]).toHaveAttribute("href", "/matching/10");
    expect(links[1]).toHaveAttribute("href", "/matching/11");
  });

  test("filters requests by status", async () => {
    matchingService.getRequests.mockResolvedValue(sampleRequests);
    renderPage();

    expect(await screen.findByText("Mentor Ava")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /^matched$/i })
    );

    expect(screen.queryByText("Mentor Ava")).not.toBeInTheDocument();
    expect(screen.getByText("Mentor Bea")).toBeInTheDocument();
  });

  test("shows empty state when there are no requests", async () => {
    matchingService.getRequests.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText(/no requests here yet/i)).toBeInTheDocument();
  });

  test("shows error state when the request fails", async () => {
    matchingService.getRequests.mockRejectedValue(new Error("network"));
    renderPage();

    expect(
      await screen.findByText(/could not load your requests/i)
    ).toBeInTheDocument();
  });

  test("shows filtered empty state when filter has no matches", async () => {
    matchingService.getRequests.mockResolvedValue(sampleRequests);
    renderPage();

    expect(await screen.findByText("Mentor Ava")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /^cancelled$/i })
    );

    await waitFor(() => {
      expect(screen.getByText(/try another status filter/i)).toBeInTheDocument();
    });
  });
});
