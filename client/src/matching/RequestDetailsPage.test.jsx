import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RequestDetailsPage from "./RequestDetailsPage";
import { MatchingLanguageProvider } from "./MatchingLanguageContext";
import * as matchingService from "./matchingService";
import { REQUEST_STATUS } from "./constants";
import { formatTimeRange } from "./utils";

jest.mock("./matchingService", () => ({
  getRequestById: jest.fn(),
  selectTimeSlot: jest.fn(),
  requestMoreTimes: jest.fn(),
  cancelMatchingRequest: jest.fn(),
  requestReschedule: jest.fn(),
  cancelMatchedMeeting: jest.fn(),
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

const mockUseParams = jest.fn(() => ({ id: "10" }));

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
    useParams: () => mockUseParams(),
    useLocation: () => ({ pathname: "/matching/10" }),
    useNavigate: () => jest.fn(),
  };
});

function baseRequest(overrides = {}) {
  return {
    id: 10,
    status: REQUEST_STATUS.PENDING_MENTOR,
    requestedAt: "2026-03-01T10:00:00.000Z",
    mentor: { id: 2, name: "Mentor Ava", avatarUrl: null },
    suggestedSlots: [],
    selectedSlot: null,
    meetingAt: null,
    moreTimesRequested: false,
    rescheduleUsed: false,
    ...overrides,
  };
}

function pendingMenteeRequest(overrides = {}) {
  return baseRequest({
    status: REQUEST_STATUS.PENDING_MENTEE,
    suggestedSlots: [
      {
        id: 101,
        start: "2026-03-10T09:00:00.000Z",
        end: "2026-03-10T10:00:00.000Z",
      },
      {
        id: 102,
        start: "2026-03-11T11:00:00.000Z",
        end: "2026-03-11T12:00:00.000Z",
      },
    ],
    ...overrides,
  });
}

function matchedRequest(overrides = {}) {
  return baseRequest({
    status: REQUEST_STATUS.MATCHED,
    meetingAt: "2026-03-10T09:00:00.000Z",
    selectedSlot: {
      id: 101,
      start: "2026-03-10T09:00:00.000Z",
      end: "2026-03-10T10:00:00.000Z",
    },
    ...overrides,
  });
}

function renderPage() {
  return render(
    <MatchingLanguageProvider>
      <RequestDetailsPage />
    </MatchingLanguageProvider>
  );
}

describe("RequestDetailsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.setItem("queenb-matching-language", "en");
    mockUseParams.mockReturnValue({ id: "10" });
  });

  test("loads request by id and shows PENDING_MENTOR banner", async () => {
    matchingService.getRequestById.mockResolvedValue(baseRequest());
    renderPage();

    expect(await screen.findByText("Mentor Ava")).toBeInTheDocument();
    expect(screen.getByText(/waiting for your mentor/i)).toBeInTheDocument();
  });

  test("shows not-found when API returns null", async () => {
    matchingService.getRequestById.mockResolvedValue(null);
    renderPage();

    expect(
      await screen.findByText(/this request could not be found/i)
    ).toBeInTheDocument();
  });

  test("shows load error when fetch fails", async () => {
    matchingService.getRequestById.mockRejectedValue(new Error("network"));
    renderPage();

    expect(
      await screen.findByText(/could not load this request/i)
    ).toBeInTheDocument();
  });

  test("shows status banners for MATCHED, CANCELLED, and REJECTED", async () => {
    matchingService.getRequestById.mockResolvedValue(matchedRequest());
    const { unmount } = renderPage();
    expect(await screen.findByText(/meeting scheduled/i)).toBeInTheDocument();
    unmount();

    matchingService.getRequestById.mockResolvedValue(
      baseRequest({
        status: REQUEST_STATUS.CANCELLED,
        meetingAt: "2026-03-10T09:00:00.000Z",
      })
    );
    const second = renderPage();
    expect(await screen.findByText(/meeting cancelled/i)).toBeInTheDocument();
    second.unmount();

    matchingService.getRequestById.mockResolvedValue(
      baseRequest({ status: REQUEST_STATUS.REJECTED })
    );
    renderPage();
    expect(
      await screen.findByText("Mentor declined", { exact: true })
    ).toBeInTheDocument();
  });

  test("confirm preferred time is disabled until a slot is chosen", async () => {
    matchingService.getRequestById.mockResolvedValue(pendingMenteeRequest());
    renderPage();

    expect(await screen.findByText(/choose a meeting time/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirm preferred time/i })
    ).toBeDisabled();
  });

  test("selecting a slot calls selectTimeSlot and shows success", async () => {
    const request = pendingMenteeRequest();
    matchingService.getRequestById.mockResolvedValue(request);
    matchingService.selectTimeSlot.mockResolvedValue(
      matchedRequest({ id: 10 })
    );
    renderPage();

    const slotLabel = formatTimeRange(
      request.suggestedSlots[0].start,
      request.suggestedSlots[0].end,
      "en"
    );
    await userEvent.click(await screen.findByRole("button", { name: slotLabel }));

    const confirm = screen.getByRole("button", {
      name: /confirm preferred time/i,
    });
    expect(confirm).not.toBeDisabled();
    await userEvent.click(confirm);

    await waitFor(() =>
      expect(matchingService.selectTimeSlot).toHaveBeenCalledWith(10, 101)
    );
    expect(
      await screen.findByText(/your preferred time was confirmed/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/meeting scheduled/i)).toBeInTheDocument();
  });

  test("shows select error when selectTimeSlot fails", async () => {
    const request = pendingMenteeRequest();
    matchingService.getRequestById.mockResolvedValue(request);
    matchingService.selectTimeSlot.mockRejectedValue(new Error("fail"));
    renderPage();

    const slotLabel = formatTimeRange(
      request.suggestedSlots[0].start,
      request.suggestedSlots[0].end,
      "en"
    );
    await userEvent.click(await screen.findByRole("button", { name: slotLabel }));
    await userEvent.click(
      screen.getByRole("button", { name: /confirm preferred time/i })
    );

    expect(
      await screen.findByText(/could not confirm the selected time/i)
    ).toBeInTheDocument();
  });

  test("request more times updates UI and disables the button", async () => {
    matchingService.getRequestById.mockResolvedValue(pendingMenteeRequest());
    matchingService.requestMoreTimes.mockResolvedValue(
      baseRequest({
        status: REQUEST_STATUS.PENDING_MENTOR,
        moreTimesRequested: true,
      })
    );
    renderPage();

    await userEvent.click(
      await screen.findByRole("button", { name: /request more times/i })
    );

    await waitFor(() =>
      expect(matchingService.requestMoreTimes).toHaveBeenCalledWith(10)
    );
    expect(
      await screen.findByText(/we asked your mentor for more times/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/waiting for your mentor/i)).toBeInTheDocument();
  });

  test("request more times button is disabled when already requested", async () => {
    matchingService.getRequestById.mockResolvedValue(
      pendingMenteeRequest({ moreTimesRequested: true })
    );
    renderPage();

    expect(
      await screen.findByRole("button", {
        name: /more times already requested/i,
      })
    ).toBeDisabled();
  });

  test("pending cancel calls cancelMatchingRequest and shows success", async () => {
    matchingService.getRequestById.mockResolvedValue(
      pendingMenteeRequest({ moreTimesRequested: true })
    );
    matchingService.cancelMatchingRequest.mockResolvedValue(
      baseRequest({ status: REQUEST_STATUS.REJECTED })
    );
    renderPage();

    await userEvent.click(
      await screen.findByRole("button", { name: /cancel request/i })
    );

    await waitFor(() =>
      expect(matchingService.cancelMatchingRequest).toHaveBeenCalledWith(10)
    );
    expect(
      await screen.findByText(/this mentoring request was cancelled/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText("Mentor declined", { exact: true })
    ).toBeInTheDocument();
  });

  test("shows cancel error when cancelMatchingRequest fails", async () => {
    matchingService.getRequestById.mockResolvedValue(
      pendingMenteeRequest({ moreTimesRequested: true })
    );
    matchingService.cancelMatchingRequest.mockRejectedValue(new Error("fail"));
    renderPage();

    await userEvent.click(
      await screen.findByRole("button", { name: /cancel request/i })
    );

    expect(
      await screen.findByText(/could not cancel this request/i)
    ).toBeInTheDocument();
  });

  test("reschedule is available when MATCHED and unused", async () => {
    matchingService.getRequestById.mockResolvedValue(
      matchedRequest({ rescheduleUsed: false })
    );
    matchingService.requestReschedule.mockResolvedValue(
      baseRequest({
        status: REQUEST_STATUS.PENDING_MENTOR,
        rescheduleUsed: true,
      })
    );
    renderPage();

    await userEvent.click(
      await screen.findByRole("button", { name: /request reschedule/i })
    );

    await waitFor(() =>
      expect(matchingService.requestReschedule).toHaveBeenCalledWith(10)
    );
    expect(
      await screen.findByText(/reschedule requested/i)
    ).toBeInTheDocument();
  });

  test("hides reschedule when rescheduleUsed is true", async () => {
    matchingService.getRequestById.mockResolvedValue(
      matchedRequest({ rescheduleUsed: true })
    );
    renderPage();

    expect(await screen.findByText(/meeting scheduled/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /request reschedule/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cancel meeting/i })
    ).toBeInTheDocument();
  });

  test("cancel meeting confirm dialog cancels and shows CANCELLED banner", async () => {
    matchingService.getRequestById.mockResolvedValue(matchedRequest());
    matchingService.cancelMatchedMeeting.mockResolvedValue(
      baseRequest({
        status: REQUEST_STATUS.CANCELLED,
        meetingAt: "2026-03-10T09:00:00.000Z",
      })
    );
    renderPage();

    await userEvent.click(
      await screen.findByRole("button", { name: /cancel meeting/i })
    );

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(/cancel this meeting\?/i)
    ).toBeInTheDocument();

    await userEvent.click(
      within(dialog).getByRole("button", { name: /^confirm$/i })
    );

    await waitFor(() =>
      expect(matchingService.cancelMatchedMeeting).toHaveBeenCalledWith(10)
    );
    expect(await screen.findByText(/meeting cancelled/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /request reschedule/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /confirm preferred time/i })
    ).not.toBeInTheDocument();
  });
});
