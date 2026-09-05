import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignUpPage from "./SignUpPage";

const mockRegister = jest.fn();
const mockNavigate = jest.fn();

jest.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    register: mockRegister,
  }),
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
    Link: MockLink,
    useNavigate: () => mockNavigate,
  };
});

function renderPage() {
  return render(<SignUpPage />);
}

async function fillValidForm({
  email = "user@example.com",
  username = "valid_user",
  password = "password1",
  confirmPassword = "password1",
} = {}) {
  await userEvent.clear(screen.getByRole("textbox", { name: /email/i }));
  await userEvent.type(screen.getByRole("textbox", { name: /email/i }), email);
  await userEvent.clear(screen.getByRole("textbox", { name: /username/i }));
  await userEvent.type(screen.getByRole("textbox", { name: /username/i }), username);
  await userEvent.clear(document.getElementById("signup-password"));
  await userEvent.type(document.getElementById("signup-password"), password);
  await userEvent.clear(document.getElementById("signup-confirm-password"));
  await userEvent.type(
    document.getElementById("signup-confirm-password"),
    confirmPassword
  );
}

describe("SignUpPage", () => {
  beforeEach(() => {
    mockRegister.mockReset();
    mockNavigate.mockReset();
  });

  test("renders Sign Up form", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /username/i })).toBeInTheDocument();
    expect(document.getElementById("signup-password")).toBeTruthy();
    expect(document.getElementById("signup-confirm-password")).toBeTruthy();
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
      "href",
      "/login"
    );
  });

  test("shows validation for empty fields", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    expect(screen.getByText(/^password is required/i)).toBeInTheDocument();
    expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test("shows validation for invalid email", async () => {
    renderPage();
    await fillValidForm({ email: "not-an-email" });
    await userEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test("shows validation for invalid username", async () => {
    renderPage();
    await fillValidForm({ username: "bad name!" });
    await userEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(
      await screen.findByText(/letters, numbers, and underscores/i)
    ).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test("shows validation for short password", async () => {
    renderPage();
    await fillValidForm({ password: "short", confirmPassword: "short" });
    await userEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test("shows validation for mismatched confirmation", async () => {
    renderPage();
    await fillValidForm({ confirmPassword: "password2" });
    await userEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test("successful registration navigates to dashboard", async () => {
    mockRegister.mockResolvedValue({
      user: { id: 1, email: "ok@example.com", username: "ok_user" },
    });
    renderPage();
    await fillValidForm({
      email: "ok@example.com",
      username: "ok_user",
    });
    await userEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
    expect(mockRegister).toHaveBeenCalledWith({
      email: "ok@example.com",
      username: "ok_user",
      password: "password1",
      confirmPassword: "password1",
    });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/dashboard"));
  });

  test("maps EMAIL_TAKEN to email field", async () => {
    mockRegister.mockRejectedValue({
      response: {
        data: {
          error: {
            code: "EMAIL_TAKEN",
            message: "An account with this email already exists.",
          },
        },
      },
    });
    renderPage();
    await fillValidForm({
      email: "taken@example.com",
      username: "fresh_user",
    });
    await userEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(
      await screen.findByText(/account with this email already exists/i)
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("maps USERNAME_TAKEN to username field", async () => {
    mockRegister.mockRejectedValue({
      response: {
        data: {
          error: {
            code: "USERNAME_TAKEN",
            message: "This username is already taken.",
          },
        },
      },
    });
    renderPage();
    await fillValidForm({
      email: "fresh@example.com",
      username: "taken_user",
    });
    await userEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(
      await screen.findByText(/username is already taken/i)
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
