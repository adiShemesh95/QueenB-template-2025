import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import ProtectedRoute, { GuestRoute } from "./ProtectedRoute";

const mockUseAuth = jest.fn();

jest.mock("../../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("react-router-dom", () => ({
  Navigate: ({ to }) => <div>Navigate to {to}</div>,
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
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
  });

  test("redirects logged-in users to /dashboard", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: "jana" },
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
