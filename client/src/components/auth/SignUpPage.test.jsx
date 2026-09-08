import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignUpPage from "./SignUpPage";
import { MatchingLanguageProvider } from "../../matching/MatchingLanguageContext";

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
  return render(
    <MatchingLanguageProvider>
      <SignUpPage />
    </MatchingLanguageProvider>
  );
}

async function fillValidForm({
  email = "user@example.com",
  username = "valid_user",
  password = "Password1!",
  confirmPassword = "Password1!",
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
    expect(screen.queryByTestId("email-requirements")).not.toBeInTheDocument();
    expect(screen.queryByTestId("username-requirements")).not.toBeInTheDocument();
    expect(screen.queryByTestId("password-requirements")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
      "href",
      "/login"
    );
  });

  test("shows live email feedback while typing", async () => {
    renderPage();
    const emailInput = screen.getByRole("textbox", { name: /email/i });

    await userEvent.type(emailInput, "not-an-email");
    expect(await screen.findByTestId("email-requirements")).toBeInTheDocument();
    expect(screen.getByTestId("email-requirement-format")).toHaveAttribute(
      "data-met",
      "false"
    );

    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, "user@example.com");
    expect(screen.getByTestId("email-requirement-format")).toHaveAttribute(
      "data-met",
      "true"
    );
  });

  test("shows live username checklist while typing", async () => {
    renderPage();
    const usernameInput = screen.getByRole("textbox", { name: /username/i });

    await userEvent.type(usernameInput, "ab");
    expect(await screen.findByTestId("username-requirements")).toBeInTheDocument();
    expect(screen.getByTestId("username-requirement-length")).toHaveAttribute(
      "data-met",
      "false"
    );
    expect(screen.getByTestId("username-requirement-chars")).toHaveAttribute(
      "data-met",
      "true"
    );

    await userEvent.type(usernameInput, "c");
    expect(screen.getByTestId("username-requirement-length")).toHaveAttribute(
      "data-met",
      "true"
    );
  });

  test("marks username character rule incomplete for invalid characters", async () => {
    renderPage();
    await userEvent.type(screen.getByRole("textbox", { name: /username/i }), "bad name!");
    expect(await screen.findByTestId("username-requirements")).toBeInTheDocument();
    expect(screen.getByTestId("username-requirement-length")).toHaveAttribute(
      "data-met",
      "true"
    );
    expect(screen.getByTestId("username-requirement-chars")).toHaveAttribute(
      "data-met",
      "false"
    );
  });

  test("valid username shows success on both rules", async () => {
    renderPage();
    await userEvent.type(screen.getByRole("textbox", { name: /username/i }), "valid_user");
    expect(await screen.findByTestId("username-requirements")).toBeInTheDocument();
    expect(screen.getByTestId("username-requirement-length")).toHaveAttribute(
      "data-met",
      "true"
    );
    expect(screen.getByTestId("username-requirement-chars")).toHaveAttribute(
      "data-met",
      "true"
    );
  });

  test("shows live password checklist while typing", async () => {
    renderPage();
    await userEvent.type(document.getElementById("signup-password"), "a");
    expect(await screen.findByTestId("password-requirements")).toBeInTheDocument();
    expect(screen.getByTestId("password-requirement-minLength")).toHaveAttribute(
      "data-met",
      "false"
    );
    expect(screen.getByTestId("password-requirement-lowercase")).toHaveAttribute(
      "data-met",
      "true"
    );
    expect(screen.getByTestId("password-strength-label")).toHaveTextContent(/weak/i);
    expect(screen.queryByText(/^strong password$/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/within 72 utf-8 byte maximum/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("password-requirement-maxBytes")).not.toBeInTheDocument();
  });

  test("updates checklist success states as password requirements are met", async () => {
    renderPage();
    const passwordInput = document.getElementById("signup-password");

    await userEvent.type(passwordInput, "Password1!");

    expect(await screen.findByTestId("password-requirements")).toBeInTheDocument();
    expect(screen.getByTestId("password-requirement-minLength")).toHaveAttribute(
      "data-met",
      "true"
    );
    expect(screen.getByTestId("password-requirement-uppercase")).toHaveAttribute(
      "data-met",
      "true"
    );
    expect(screen.getByTestId("password-requirement-lowercase")).toHaveAttribute(
      "data-met",
      "true"
    );
    expect(screen.getByTestId("password-requirement-number")).toHaveAttribute(
      "data-met",
      "true"
    );
    expect(screen.getByTestId("password-requirement-special")).toHaveAttribute(
      "data-met",
      "true"
    );
    expect(screen.queryByTestId("password-requirement-maxBytes")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/within 72 utf-8 byte maximum/i)
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("password-strength-label")).toHaveTextContent(
      /^strong password$/i
    );
  });

  test("does not show Strong password when a requirement is still missing", async () => {
    renderPage();
    await userEvent.type(document.getElementById("signup-password"), "Password1");
    expect(await screen.findByTestId("password-requirements")).toBeInTheDocument();
    expect(screen.getByTestId("password-requirement-special")).toHaveAttribute(
      "data-met",
      "false"
    );
    expect(screen.getByTestId("password-strength-label")).not.toHaveTextContent(
      /^strong password$/i
    );
    expect(screen.getByTestId("password-strength-label")).toHaveTextContent(/medium/i);
  });

  test("does not show Strong password when password exceeds 72 UTF-8 bytes", async () => {
    // Meets visible strength rules but exceeds the hidden 72-byte maximum.
    const longPassword = `${"A".repeat(70)}a1!`;
    renderPage();
    await userEvent.type(document.getElementById("signup-password"), longPassword);
    expect(await screen.findByTestId("password-requirements")).toBeInTheDocument();
    expect(
      screen.queryByText(/within 72 utf-8 byte maximum/i)
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("password-strength-label")).not.toHaveTextContent(
      /^strong password$/i
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

  test("shows validation for password exceeding 72 UTF-8 bytes", async () => {
    const longPassword = "é".repeat(40); // 80 bytes in UTF-8
    renderPage();
    await fillValidForm({ password: longPassword, confirmPassword: longPassword });
    await userEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(await screen.findByText(/password is too long/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/within 72 utf-8 byte maximum/i)
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("password-strength-label")).not.toHaveTextContent(
      /^strong password$/i
    );
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test("shows validation for invalid email on submit", async () => {
    renderPage();
    await fillValidForm({ email: "not-an-email" });
    expect(screen.getByTestId("email-requirement-format")).toHaveAttribute(
      "data-met",
      "false"
    );
    await userEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test("shows validation for invalid username", async () => {
    renderPage();
    await fillValidForm({ username: "bad name!" });
    await userEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(
      await screen.findByText(
        /username may only contain letters, numbers, and underscores/i
      )
    ).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test("shows validation for short password", async () => {
    renderPage();
    await fillValidForm({ password: "short", confirmPassword: "short" });
    await userEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(
      await screen.findByText(/password must be at least 8 characters/i)
    ).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  // Password-strength cases: UI should show the matching error before calling register.
  test("shows validation for password without uppercase", async () => {
    renderPage();
    await fillValidForm({ password: "password1!", confirmPassword: "password1!" });
    await userEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(
      await screen.findByText(/password must include at least one uppercase letter/i)
    ).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test("shows validation for password without lowercase", async () => {
    renderPage();
    await fillValidForm({ password: "PASSWORD1!", confirmPassword: "PASSWORD1!" });
    await userEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(
      await screen.findByText(/password must include at least one lowercase letter/i)
    ).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test("shows validation for password without number", async () => {
    renderPage();
    await fillValidForm({ password: "Password!", confirmPassword: "Password!" });
    await userEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(
      await screen.findByText(/password must include at least one number/i)
    ).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test("shows validation for password without special character", async () => {
    renderPage();
    await fillValidForm({ password: "Password1", confirmPassword: "Password1" });
    await userEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    expect(
      await screen.findByText(/password must include at least one special character/i)
    ).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  test("shows validation for mismatched confirmation", async () => {
    renderPage();
    await fillValidForm({ confirmPassword: "Different1!" });
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
    expect(screen.getByTestId("password-strength-label")).toHaveTextContent(
      /^strong password$/i
    );
    await userEvent.click(screen.getByRole("button", { name: /^sign up$/i }));
    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
    expect(mockRegister).toHaveBeenCalledWith({
      email: "ok@example.com",
      username: "ok_user",
      password: "Password1!",
      confirmPassword: "Password1!",
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
