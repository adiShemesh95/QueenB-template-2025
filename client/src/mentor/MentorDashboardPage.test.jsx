import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MentorDashboardPage from "./MentorDashboardPage";
import { MatchingLanguageProvider } from "../matching/MatchingLanguageContext";
import * as mentorService from "./mentorService";
import { REQUEST_STATUS } from "../matching/constants";

jest.mock("./mentorService", () => ({
  getMyMentorProfile: jest.fn(),
  getMentorRequests: jest.fn(),
  proposeSlots: jest.fn(),
  rejectMentorRequest: jest.fn(),
  requestReschedule: jest.fn(),
  cancelMatchedMeeting: jest.fn(),
}));

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 2, username: "mentorUser", isAdmin: false },
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
    useLocation: () => ({ pathname: "/mentor/inbox" }),
    useNavigate: () => jest.fn(),
  };
});

function baseRequest(overrides = {}) {
  return {
    id: 20,
    status: REQUEST_STATUS.PENDING_MENTOR,
    createdAt: "2026-03-01T10:00:00.000Z",
    mentee: { id: 1, username: "menteeDana" },
    suggestedSlots: [],
    meetingAt: null,
    moreTimesRequested: false,
    rescheduleUsed: false,
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MatchingLanguageProvider>
      <MentorDashboardPage />
    </MatchingLanguageProvider>
  );
}

describe("MentorDashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.setItem("queenb-matching-language", "en");
    mentorService.getMyMentorProfile.mockResolvedValue({
      id: 5,
      sessionDuration: 30,
      isActive: true,
    });
  });

  test("loads requests and uses profile session duration", async () => {
    mentorService.getMentorRequests.mockResolvedValue([
      baseRequest({ mentee: { id: 1, username: "menteeDana" } }),
    ]);
    renderPage();

    expect(await screen.findByText("menteeDana")).toBeInTheDocument();
    expect(mentorService.getMyMentorProfile).toHaveBeenCalled();
    expect(mentorService.getMentorRequests).toHaveBeenCalled();
    expect(screen.getByText(/offer time slots/i)).toBeInTheDocument();
  });

  test("shows empty and error states", async () => {
    mentorService.getMentorRequests.mockResolvedValue([]);
    const { unmount } = renderPage();
    expect(await screen.findByText(/no requests yet/i)).toBeInTheDocument();
    unmount();

    mentorService.getMentorRequests.mockRejectedValue(new Error("network"));
    renderPage();
    expect(
      await screen.findByText(/unable to load mentor requests/i)
    ).toBeInTheDocument();
  });

  test("filters inbox by status", async () => {
    mentorService.getMentorRequests.mockResolvedValue([
      baseRequest({
        id: 1,
        status: REQUEST_STATUS.PENDING_MENTOR,
        mentee: { id: 1, username: "waitingMentor" },
      }),
      baseRequest({
        id: 2,
        status: REQUEST_STATUS.MATCHED,
        mentee: { id: 3, username: "matchedMentee" },
        meetingAt: "2026-03-10T09:00:00.000Z",
      }),
    ]);
    renderPage();

    expect(await screen.findByText("waitingMentor")).toBeInTheDocument();
    expect(screen.getByText("matchedMentee")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /^matched$/i })
    );

    expect(screen.queryByText("waitingMentor")).not.toBeInTheDocument();
    expect(screen.getByText("matchedMentee")).toBeInTheDocument();
  });

  test("propose only on PENDING_MENTOR; reject on pending statuses", async () => {
    mentorService.getMentorRequests.mockResolvedValue([
      baseRequest({
        id: 1,
        status: REQUEST_STATUS.PENDING_MENTOR,
        mentee: { id: 1, username: "pendingMentorMentee" },
      }),
      baseRequest({
        id: 2,
        status: REQUEST_STATUS.PENDING_MENTEE,
        mentee: { id: 2, username: "pendingMenteeUser" },
        suggestedSlots: [
          {
            id: 9,
            start: "2026-03-10T09:00:00.000Z",
            end: "2026-03-10T09:30:00.000Z",
          },
        ],
      }),
      baseRequest({
        id: 3,
        status: REQUEST_STATUS.MATCHED,
        mentee: { id: 3, username: "matchedUser" },
        meetingAt: "2026-03-10T09:00:00.000Z",
        rescheduleUsed: false,
      }),
    ]);
    renderPage();

    expect(await screen.findByText("pendingMentorMentee")).toBeInTheDocument();

    expect(screen.getAllByRole("button", { name: /^reject$/i })).toHaveLength(
      2
    );
    expect(
      screen.getAllByRole("button", { name: /send proposed times/i })
    ).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: /request reschedule/i })
    ).toBeInTheDocument();
  });

  test("empty propose drafts show local validation and do not call API", async () => {
    mentorService.getMentorRequests.mockResolvedValue([baseRequest()]);
    renderPage();

    await userEvent.click(
      await screen.findByRole("button", { name: /send proposed times/i })
    );

    expect(
      await screen.findByText(/add at least one start time/i)
    ).toBeInTheDocument();
    expect(mentorService.proposeSlots).not.toHaveBeenCalled();
  });

  test("propose with valid start calls proposeSlots with derived end", async () => {
    mentorService.getMentorRequests.mockResolvedValue([baseRequest()]);
    mentorService.proposeSlots.mockResolvedValue({});
    mentorService.getMentorRequests
      .mockResolvedValueOnce([baseRequest()])
      .mockResolvedValueOnce([
        baseRequest({
          status: REQUEST_STATUS.PENDING_MENTEE,
          suggestedSlots: [
            {
              id: 1,
              start: "2026-04-01T10:00:00.000Z",
              end: "2026-04-01T10:30:00.000Z",
            },
          ],
        }),
      ]);
    renderPage();

    await screen.findByLabelText(/start 1/i);
    const startInput = screen.getByLabelText(/start 1/i);
    fireEvent.change(startInput, { target: { value: "2026-04-01T13:00" } });

    await userEvent.click(
      screen.getByRole("button", { name: /send proposed times/i })
    );

    await waitFor(() => expect(mentorService.proposeSlots).toHaveBeenCalled());
    const [requestId, slots] = mentorService.proposeSlots.mock.calls[0];
    expect(requestId).toBe(20);
    expect(slots).toHaveLength(1);
    expect(slots[0].startTime).toBe(new Date("2026-04-01T13:00").toISOString());
    expect(slots[0].endTime).toBe(
      new Date(new Date("2026-04-01T13:00").getTime() + 30 * 60 * 1000).toISOString()
    );
    expect(
      await screen.findByText(/time slots sent to the mentee/i)
    ).toBeInTheDocument();
  });

  test("reject calls rejectMentorRequest and shows feedback", async () => {
    mentorService.getMentorRequests
      .mockResolvedValueOnce([baseRequest()])
      .mockResolvedValueOnce([]);
    mentorService.rejectMentorRequest.mockResolvedValue({});
    renderPage();

    await userEvent.click(
      await screen.findByRole("button", { name: /^reject$/i })
    );

    await waitFor(() =>
      expect(mentorService.rejectMentorRequest).toHaveBeenCalledWith(20)
    );
    expect(await screen.findByText(/request declined/i)).toBeInTheDocument();
  });

  test("reschedule action only when matched and unused", async () => {
    mentorService.getMentorRequests.mockResolvedValue([
      baseRequest({
        id: 1,
        status: REQUEST_STATUS.MATCHED,
        mentee: { id: 1, username: "canReschedule" },
        meetingAt: "2026-03-10T09:00:00.000Z",
        rescheduleUsed: false,
      }),
      baseRequest({
        id: 2,
        status: REQUEST_STATUS.MATCHED,
        mentee: { id: 2, username: "alreadyUsed" },
        meetingAt: "2026-03-11T09:00:00.000Z",
        rescheduleUsed: true,
      }),
    ]);
    mentorService.requestReschedule.mockResolvedValue({});
    renderPage();

    expect(await screen.findByText("canReschedule")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /request reschedule/i })).toHaveLength(
      1
    );

    await userEvent.click(
      screen.getByRole("button", { name: /request reschedule/i })
    );
    await waitFor(() =>
      expect(mentorService.requestReschedule).toHaveBeenCalledWith(1)
    );
  });

  test("cancel meeting confirm cancels and cancelled row has no propose/reject", async () => {
    mentorService.getMentorRequests
      .mockResolvedValueOnce([
        baseRequest({
          status: REQUEST_STATUS.MATCHED,
          mentee: { id: 1, username: "toCancel" },
          meetingAt: "2026-03-10T09:00:00.000Z",
        }),
      ])
      .mockResolvedValueOnce([
        baseRequest({
          status: REQUEST_STATUS.CANCELLED,
          mentee: { id: 1, username: "toCancel" },
          meetingAt: "2026-03-10T09:00:00.000Z",
        }),
      ]);
    mentorService.cancelMatchedMeeting.mockResolvedValue({});
    renderPage();

    await userEvent.click(
      await screen.findByRole("button", { name: /cancel meeting/i })
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /^confirm$/i })
    );

    await waitFor(() =>
      expect(mentorService.cancelMatchedMeeting).toHaveBeenCalledWith(20)
    );
    expect(
      await screen.findByText(/the matched meeting was cancelled/i)
    ).toBeInTheDocument();
    expect(await screen.findByText(/cancelled meeting:/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /send proposed times/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^reject$/i })
    ).not.toBeInTheDocument();
  });
});
