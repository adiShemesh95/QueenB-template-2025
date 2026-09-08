import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const sampleUsers = [
  {
    id: 7,
    username: "dana",
    email: "dana@example.com",
    createdAt: "2026-01-10T10:00:00.000Z",
    isAdmin: false,
    matchingCountAsMentor: 2,
    matchingCountAsMentee: 1,
  },
  {
    id: 8,
    username: "Alex",
    email: "alex.mentor@Example.ORG",
    createdAt: "2026-02-01T10:00:00.000Z",
    isAdmin: false,
    matchingCountAsMentor: 0,
    matchingCountAsMentee: 3,
  },
];

describe("AdminUsersPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders backend user data and links to user details", async () => {
    adminService.getAdminUsers.mockResolvedValue([sampleUsers[0]]);

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

  test("filters users by username", async () => {
    adminService.getAdminUsers.mockResolvedValue(sampleUsers);
    render(<AdminUsersPage />);

    expect(await screen.findByText("dana")).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();

    await userEvent.type(
      screen.getByRole("textbox", { name: /search users/i }),
      "dana"
    );

    expect(screen.getByText("dana")).toBeInTheDocument();
    expect(screen.queryByText("Alex")).not.toBeInTheDocument();
  });

  test("filters users by email", async () => {
    adminService.getAdminUsers.mockResolvedValue(sampleUsers);
    render(<AdminUsersPage />);

    expect(await screen.findByText("dana")).toBeInTheDocument();

    await userEvent.type(
      screen.getByRole("textbox", { name: /search users/i }),
      "alex.mentor"
    );

    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.queryByText("dana")).not.toBeInTheDocument();
  });

  test("search is case-insensitive", async () => {
    adminService.getAdminUsers.mockResolvedValue(sampleUsers);
    render(<AdminUsersPage />);

    expect(await screen.findByText("dana")).toBeInTheDocument();

    await userEvent.type(
      screen.getByRole("textbox", { name: /search users/i }),
      "DANA"
    );

    expect(screen.getByText("dana")).toBeInTheDocument();
    expect(screen.queryByText("Alex")).not.toBeInTheDocument();
  });

  test("trims leading and trailing spaces from the search query", async () => {
    adminService.getAdminUsers.mockResolvedValue(sampleUsers);
    render(<AdminUsersPage />);

    expect(await screen.findByText("dana")).toBeInTheDocument();

    await userEvent.type(
      screen.getByRole("textbox", { name: /search users/i }),
      "  dana  "
    );

    expect(screen.getByText("dana")).toBeInTheDocument();
    expect(screen.queryByText("Alex")).not.toBeInTheDocument();
  });

  test("clearing search restores all users", async () => {
    adminService.getAdminUsers.mockResolvedValue(sampleUsers);
    render(<AdminUsersPage />);

    const searchInput = await screen.findByRole("textbox", {
      name: /search users/i,
    });

    await userEvent.type(searchInput, "dana");
    expect(screen.queryByText("Alex")).not.toBeInTheDocument();

    await userEvent.clear(searchInput);

    expect(screen.getByText("dana")).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
  });

  test("shows no results state when search matches nothing", async () => {
    adminService.getAdminUsers.mockResolvedValue(sampleUsers);
    render(<AdminUsersPage />);

    expect(await screen.findByText("dana")).toBeInTheDocument();

    await userEvent.type(
      screen.getByRole("textbox", { name: /search users/i }),
      "nobody-matches"
    );

    expect(screen.getByText("No users found")).toBeInTheDocument();
    expect(screen.queryByText("dana")).not.toBeInTheDocument();
    expect(screen.queryByText("Alex")).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
