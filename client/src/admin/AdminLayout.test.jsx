import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminLayout from "./AdminLayout";

const mockLogout = jest.fn();
const mockNavigate = jest.fn();

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, username: "adminUser", isAdmin: true },
    logout: mockLogout,
  }),
}));

jest.mock("../components/Logo", () => {
  const React = require("react");
  return function MockLogo({ disableLink }) {
    return React.createElement(
      "div",
      {
        "data-testid": "admin-logo",
        "data-disable-link": disableLink ? "true" : "false",
      },
      "Queens Match"
    );
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
    Outlet: () => React.createElement("div", null, "Outlet"),
    useLocation: () => ({ pathname: "/admin" }),
    useNavigate: () => mockNavigate,
  };
});

describe("AdminLayout logout", () => {
  beforeEach(() => {
    mockLogout.mockReset();
    mockNavigate.mockReset();
    mockLogout.mockResolvedValue(undefined);
  });

  test("Admin logout navigates to Sign In with Admin intent", async () => {
    render(<AdminLayout />);

    await userEvent.click(screen.getByRole("button", { name: /^logout$/i }));

    await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
    expect(mockNavigate).toHaveBeenCalledWith("/login", {
      replace: true,
      state: { adminIntent: true, from: "/admin" },
    });
    expect(mockNavigate).not.toHaveBeenCalledWith("/");
    expect(mockNavigate).not.toHaveBeenCalledWith("/dashboard");
  });

  test("Admin logo is rendered as display-only (no dashboard link)", () => {
    render(<AdminLayout />);

    expect(screen.getByTestId("admin-logo")).toHaveAttribute(
      "data-disable-link",
      "true"
    );
    expect(
      screen.queryByRole("link", { name: /queens match/i })
    ).not.toBeInTheDocument();
  });
});
