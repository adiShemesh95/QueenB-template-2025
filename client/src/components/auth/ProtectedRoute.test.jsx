import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import ProtectedRoute, { GuestRoute } from "./ProtectedRoute";

const mockUseAuth = jest.fn();
const mockLocation = { current: { pathname: "/login", state: null } };

jest.mock("../../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("react-router-dom", () => ({
  Navigate: ({ to }) => <div>Navigate to {to}</div>,
  useLocation: () => mockLocation.current,
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockLocation.current = { pathname: "/login", state: null };
  });

  test("shows loading state while auth is loading", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    render(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>
    );
    expect(screen.getByText(/checking your session/i)).toBeInTheDocument();
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
    expect(screen.queryByText(/Navigate to/)).not.toBeInTheDocument();
  });

  test("redirects logged-out users to /login", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    render(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>
    );
    expect(screen.getByText("Navigate to /login")).toBeInTheDocument();
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  test("renders children for logged-in users", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: "jana" },
      loading: false,
    });
    render(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>
    );
    expect(screen.getByText("Secret")).toBeInTheDocument();
  });
});

describe("GuestRoute", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockLocation.current = { pathname: "/login", state: null };
  });

  test("redirects logged-in users to /dashboard on normal login flow", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: "jana", isAdmin: false },
      loading: false,
    });
    render(
      <GuestRoute>
        <div>Guest Form</div>
      </GuestRoute>
    );
    expect(screen.getByText("Navigate to /dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Guest Form")).not.toBeInTheDocument();
  });

  test("Admin-intent login redirects authenticated Admin to /admin not /dashboard", () => {
    mockLocation.current = {
      pathname: "/login",
      state: { adminIntent: true, from: "/admin" },
    };
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: "admin", isAdmin: true },
      loading: false,
    });
    render(
      <GuestRoute>
        <div>Guest Form</div>
      </GuestRoute>
    );
    expect(screen.getByText("Navigate to /admin")).toBeInTheDocument();
    expect(screen.queryByText("Navigate to /dashboard")).not.toBeInTheDocument();
  });

  test("Admin-intent login preserves nested /admin from path", () => {
    mockLocation.current = {
      pathname: "/login",
      state: { adminIntent: true, from: "/admin/calendar" },
    };
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: "admin", isAdmin: true },
      loading: false,
    });
    render(
      <GuestRoute>
        <div>Guest Form</div>
      </GuestRoute>
    );
    expect(screen.getByText("Navigate to /admin/calendar")).toBeInTheDocument();
  });

  test("Admin-intent non-admin is sent to /admin (access-required) not /dashboard", () => {
    mockLocation.current = {
      pathname: "/login",
      state: { adminIntent: true, from: "/admin" },
    };
    mockUseAuth.mockReturnValue({
      user: { id: 2, username: "mentee", isAdmin: false },
      loading: false,
    });
    render(
      <GuestRoute>
        <div>Guest Form</div>
      </GuestRoute>
    );
    expect(screen.getByText("Navigate to /admin")).toBeInTheDocument();
    expect(screen.queryByText("Navigate to /dashboard")).not.toBeInTheDocument();
  });

  test("renders children for logged-out users", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    render(
      <GuestRoute>
        <div>Guest Form</div>
      </GuestRoute>
    );
    expect(screen.getByText("Guest Form")).toBeInTheDocument();
  });
});
