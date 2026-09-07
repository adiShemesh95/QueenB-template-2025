import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import AdminUsersPage from "./AdminUsersPage";
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

describe("AdminUsersPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders backend user data and links to user details", async () => {
    adminService.getAdminUsers.mockResolvedValue([
      {
        id: 7,
        username: "dana",
        email: "dana@example.com",
        createdAt: "2026-01-10T10:00:00.000Z",
        isAdmin: false,
        matchingCountAsMentor: 2,
        matchingCountAsMentee: 1,
      },
    ]);

    render(<AdminUsersPage />);

    expect(await screen.findByText("dana")).toBeInTheDocument();
    expect(screen.getByText("dana@example.com")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Mentoring matchings")).toBeInTheDocument();

    const detailsLink = screen.getByRole("link", { name: /view details/i });
    expect(detailsLink).toHaveAttribute("href", "/admin/users/7");
  });

  test("shows empty state when there are no users", async () => {
    adminService.getAdminUsers.mockResolvedValue([]);
    render(<AdminUsersPage />);
    expect(await screen.findByText(/no users found/i)).toBeInTheDocument();
  });

  test("shows error state when the request fails", async () => {
    adminService.getAdminUsers.mockRejectedValue(new Error("network"));
    render(<AdminUsersPage />);
    expect(
      await screen.findByText(/could not load users/i)
    ).toBeInTheDocument();
  });
});
