import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminRoute from "./AdminRoute";

const mockUseAuth = jest.fn();
const mockNavigate = jest.fn();
const mockLogout = jest.fn();

jest.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("react-router-dom", () => {
  const React = require("react");
  const MockLink = React.forwardRef(function MockLink(
    { children, to, ...props },
    ref
  ) {
    return React.createElement("a", { href: to, ref, ...props }, children);
  });
  return {
    Navigate: ({ to, state }) => (
      <div>
        Navigate to {to}
        {state?.adminIntent ? " (adminIntent)" : ""}
        {state?.from ? ` from=${state.from}` : ""}
      </div>
    ),
    Link: MockLink,
    useLocation: () => ({ pathname: "/admin", search: "" }),
    useNavigate: () => mockNavigate,
  };
});

describe("AdminRoute", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockNavigate.mockReset();
    mockLogout.mockReset();
  });

  test("shows loading state and does not redirect while auth is loading", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    render(
      <AdminRoute>
        <div>Admin content</div>
      </AdminRoute>
    );
    expect(screen.getByText(/checking your session/i)).toBeInTheDocument();
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
    expect(screen.queryByText(/Navigate to/)).not.toBeInTheDocument();
  });

  test("unauthenticated /admin preserves Admin intent on login redirect", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    render(
      <AdminRoute>
        <div>Admin content</div>
      </AdminRoute>
    );
    expect(
      screen.getByText("Navigate to /login (adminIntent) from=/admin")
    ).toBeInTheDocument();
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  test("already-authenticated non-admin is denied without Admin dashboard", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 2, username: "mentee", isAdmin: false },
      loading: false,
      logout: mockLogout,
    });
    render(
      <AdminRoute>
        <div>Admin content</div>
      </AdminRoute>
    );
    expect(
      screen.getByRole("heading", { name: /admin access required/i })
    ).toBeInTheDocument();
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
    expect(screen.queryByText(/Navigate to \/dashboard/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /continue to the app/i })
    ).toHaveAttribute("href", "/dashboard");
  });

  test("already-authenticated Admin can open /admin", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: "admin", isAdmin: true },
      loading: false,
    });
    render(
      <AdminRoute>
        <div>Admin content</div>
      </AdminRoute>
    );
    expect(screen.getByText("Admin content")).toBeInTheDocument();
  });

  test("non-admin can sign out to use a different account", async () => {
    mockLogout.mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      user: { id: 2, username: "mentee", isAdmin: false },
      loading: false,
      logout: mockLogout,
    });
    render(
      <AdminRoute>
        <div>Admin content</div>
      </AdminRoute>
    );

    await userEvent.click(
      screen.getByRole("button", { name: /sign in with a different account/i })
    );
    expect(mockLogout).toHaveBeenCalled();
    await screen.findByText(/signing out/i).catch(() => null);
    expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
  });
});
