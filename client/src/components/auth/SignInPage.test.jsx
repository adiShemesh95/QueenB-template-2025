import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignInPage from "./SignInPage";

const mockLogin = jest.fn();
const mockNavigate = jest.fn();

jest.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
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
  return render(<SignInPage />);
}

async function fillValidForm({
  email = "user@example.com",
  password = "password1",
} = {}) {
  await userEvent.clear(screen.getByRole("textbox", { name: /email/i }));
  await userEvent.type(screen.getByRole("textbox", { name: /email/i }), email);
  await userEvent.clear(document.getElementById("signin-password"));
  await userEvent.type(document.getElementById("signin-password"), password);
}

describe("SignInPage", () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
  });

  test("renders Sign In form", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /email/i })).toBeInTheDocument();
    expect(document.getElementById("signin-password")).toBeTruthy();
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute(
      "href",
      "/register"
    );
  });

  test("shows validation for empty fields", async () => {
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/^password is required/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test("shows validation for invalid email", async () => {
    renderPage();
    await fillValidForm({ email: "not-an-email" });
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test("successful login navigates to dashboard", async () => {
    mockLogin.mockResolvedValue({
      user: { id: 1, email: "ok@example.com", username: "ok_user" },
    });
    renderPage();
    await fillValidForm({
      email: "ok@example.com",
      password: "password1",
    });
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
    await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(1));
    expect(mockLogin).toHaveBeenCalledWith({
      email: "ok@example.com",
      password: "password1",
    });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/dashboard"));
  });

  test("shows generic message for INVALID_CREDENTIALS", async () => {
    mockLogin.mockRejectedValue({
      response: {
        data: {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password.",
          },
        },
      },
    });
    renderPage();
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(
      await screen.findByText(/invalid email or password/i)
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("shows same generic message for wrong password and unknown email", async () => {
    mockLogin.mockRejectedValue({
      response: {
        data: {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password.",
          },
        },
      },
    });
    renderPage();
    await fillValidForm({ email: "unknown@example.com" });
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(
      await screen.findByText(/^invalid email or password\.$/i)
    ).toBeInTheDocument();
  });

  test("disables submit while loading to prevent duplicate submissions", async () => {
    let resolveLogin;
    mockLogin.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        })
    );
    renderPage();
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
    const loadingButton = await screen.findByRole("button", {
      name: /signing in/i,
    });
    expect(loadingButton).toBeDisabled();
    expect(mockLogin).toHaveBeenCalledTimes(1);
    resolveLogin({
      user: { id: 1, email: "user@example.com", username: "valid_user" },
    });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/dashboard"));
  });
});
