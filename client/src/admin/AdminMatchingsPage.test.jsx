import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminMatchingsPage from "./AdminMatchingsPage";
import * as adminService from "./adminService";

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

const sampleMatchings = [
  {
    id: 42,
    status: "PENDING_MENTOR",
    createdAt: "2026-02-01T09:00:00.000Z",
    updatedAt: "2026-02-01T09:00:00.000Z",
    mentor: { id: 1, username: "mentorA", email: "a@ex.com" },
    mentee: { id: 2, username: "menteeB", email: "b@ex.com" },
    selectedSlot: null,
  },
  {
    id: 43,
    status: "MATCHED",
    createdAt: "2026-02-02T09:00:00.000Z",
    updatedAt: "2026-02-02T10:00:00.000Z",
    mentor: { id: 1, username: "mentorA", email: "a@ex.com" },
    mentee: { id: 3, username: "menteeC", email: "c@ex.com" },
    selectedSlot: {
      id: 9,
      start: "2026-03-01T14:00:00.000Z",
      end: "2026-03-01T15:00:00.000Z",
    },
  },
];

const sampleUsers = [
  {
    id: 1,
    username: "mentorA",
    email: "a@ex.com",
    matchingCountAsMentor: 1,
    matchingCountAsMentee: 0,
  },
  {
    id: 2,
    username: "menteeB",
    email: "b@ex.com",
    matchingCountAsMentor: 0,
    matchingCountAsMentee: 1,
  },
];

describe("AdminMatchingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    adminService.getAdminUsers.mockResolvedValue(sampleUsers);
    adminService.getAdminMatchings.mockResolvedValue(sampleMatchings);
  });

  test("renders matching rows with readable status labels and detail links", async () => {
    render(<AdminMatchingsPage />);

    expect(await screen.findByText("Waiting for mentor times")).toBeInTheDocument();
    expect(screen.getByText("Matched")).toBeInTheDocument();
    expect(screen.getAllByText("mentorA").length).toBeGreaterThan(0);

    const detailLinks = screen.getAllByRole("link", { name: /view details/i });
    expect(detailLinks[0]).toHaveAttribute("href", "/admin/matchings/42");
    expect(detailLinks[1]).toHaveAttribute("href", "/admin/matchings/43");
  });

  test("status filter sends the exact backend status value", async () => {
    render(<AdminMatchingsPage />);
    await screen.findByText("Waiting for mentor times");

    const statusSelect = screen.getByLabelText("Status");
    await userEvent.click(statusSelect);
    await userEvent.click(
      await screen.findByRole("option", { name: /waiting for mentee selection/i })
    );

    await waitFor(() => {
      expect(adminService.getAdminMatchings).toHaveBeenCalledWith({
        status: "PENDING_MENTEE",
      });
    });
  });

  test("participant filter sends participantId and can combine with status", async () => {
    render(<AdminMatchingsPage />);
    await screen.findByText("Waiting for mentor times");

    const participantInput = screen.getByLabelText("Participant");
    await userEvent.click(participantInput);
    await userEvent.type(participantInput, "menteeB");
    const option = await screen.findByRole("option", {
      name: /menteeB \(b@ex\.com\)/i,
    });
    await userEvent.click(option);

    await waitFor(() => {
      expect(adminService.getAdminMatchings).toHaveBeenCalledWith({
        participantId: 2,
      });
    });

    const statusSelect = screen.getByLabelText("Status");
    await userEvent.click(statusSelect);
    await userEvent.click(
      await screen.findByRole("option", { name: /^Matched$/i })
    );

    await waitFor(() => {
      expect(adminService.getAdminMatchings).toHaveBeenCalledWith({
        status: "MATCHED",
        participantId: 2,
      });
    });
  });

  test("reset clears filters and reloads without query params", async () => {
    render(<AdminMatchingsPage />);
    await screen.findByText("Waiting for mentor times");

    const statusSelect = screen.getByLabelText("Status");
    await userEvent.click(statusSelect);
    await userEvent.click(
      await screen.findByRole("option", { name: /^Rejected$/i })
    );

    await waitFor(() => {
      expect(adminService.getAdminMatchings).toHaveBeenCalledWith({
        status: "REJECTED",
      });
    });

    await userEvent.click(screen.getByRole("button", { name: /reset filters/i }));

    await waitFor(() => {
      expect(adminService.getAdminMatchings).toHaveBeenCalledWith({});
    });
  });

  test("shows filtered empty state", async () => {
    adminService.getAdminMatchings
      .mockResolvedValueOnce(sampleMatchings)
      .mockResolvedValueOnce([]);

    render(<AdminMatchingsPage />);
    await screen.findByText("Waiting for mentor times");

    const statusSelect = screen.getByLabelText("Status");
    await userEvent.click(statusSelect);
    await userEvent.click(
      await screen.findByRole("option", { name: /^Rejected$/i })
    );

    expect(
      await screen.findByText(/no matchings found for the selected filters/i)
    ).toBeInTheDocument();
  });
});
