import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import AdminRoute from "./AdminRoute";

const mockUseAuth = jest.fn();

jest.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("react-router-dom", () => ({
  Navigate: ({ to }) => <div>Navigate to {to}</div>,
}));

describe("AdminRoute", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
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

  test("redirects unauthenticated users to /login", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    render(
      <AdminRoute>
        <div>Admin content</div>
      </AdminRoute>
    );
    expect(screen.getByText("Navigate to /login")).toBeInTheDocument();
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  test("non-admin cannot render protected Admin content", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 2, username: "mentee", isAdmin: false },
      loading: false,
    });
    render(
      <AdminRoute>
        <div>Admin content</div>
      </AdminRoute>
    );
    expect(screen.getByText("Navigate to /dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });

  test("Admin can render protected Admin content", () => {
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
});
