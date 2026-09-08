import React from "react";
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LanguageSelector from "./home/LanguageSelector";
import {
  MatchingLanguageProvider,
  useMatchingLanguage,
} from "../matching/MatchingLanguageContext";
import SignInPage from "./auth/SignInPage";
import Dashboard from "./Dashboard";
import AdminLayout from "../admin/AdminLayout";

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, username: "dana", isAdmin: true },
    login: jest.fn(),
    logout: jest.fn().mockResolvedValue(undefined),
    register: jest.fn(),
  }),
}));

jest.mock("./Logo", () => {
  const React = require("react");
  return function MockLogo() {
    return React.createElement("div", { "data-testid": "logo" }, "Logo");
  };
});

jest.mock("./BootcampFooter", () => {
  const React = require("react");
  return function MockBootcampFooter() {
    return React.createElement("footer", { "data-testid": "bootcamp-footer" });
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
    useLocation: () => ({ pathname: "/admin/calendar", state: null }),
    useNavigate: () => jest.fn(),
  };
});

async function selectLanguage(label) {
  await userEvent.click(
    screen.getByRole("button", {
      name: /select language|בחירת שפה|اختيار اللغة/i,
    })
  );
  const menu = await screen.findByRole("menu");
  await userEvent.click(within(menu).getByText(label));
}

function LanguageHarness() {
  const { language, setLanguage, dir, t } = useMatchingLanguage();
  return (
    <div>
      <LanguageSelector
        language={language}
        onLanguageChange={setLanguage}
        ariaLabel={t.languageAria}
      />
      <span data-testid="dir">{dir}</span>
      <span data-testid="sample">{t.myRequests}</span>
    </div>
  );
}

describe("LanguageSelector", () => {
  test("offers English, Hebrew, and Arabic", async () => {
    const onLanguageChange = jest.fn();
    render(
      <LanguageSelector language="en" onLanguageChange={onLanguageChange} />
    );

    await userEvent.click(
      screen.getByRole("button", { name: /select language/i })
    );
    const menu = await screen.findByRole("menu");
    expect(within(menu).getByText("English")).toBeInTheDocument();
    expect(within(menu).getByText("עברית")).toBeInTheDocument();
    expect(within(menu).getByText("العربية")).toBeInTheDocument();

    await userEvent.click(within(menu).getByText("العربية"));
    expect(onLanguageChange).toHaveBeenCalledWith("ar");
  });
});

describe("shared MatchingLanguageProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("switches UI text and dir for he, ar, and en", async () => {
    render(
      <MatchingLanguageProvider>
        <LanguageHarness />
      </MatchingLanguageProvider>
    );

    expect(screen.getByTestId("dir")).toHaveTextContent("ltr");
    expect(screen.getByTestId("sample")).toHaveTextContent("My Requests");

    await selectLanguage("עברית");
    expect(screen.getByTestId("dir")).toHaveTextContent("rtl");
    expect(screen.getByTestId("sample")).toHaveTextContent("הבקשות שלי");

    await selectLanguage("العربية");
    expect(screen.getByTestId("dir")).toHaveTextContent("rtl");
    expect(screen.getByTestId("sample")).toHaveTextContent("طلباتي");

    await selectLanguage("English");
    expect(screen.getByTestId("dir")).toHaveTextContent("ltr");
    expect(screen.getByTestId("sample")).toHaveTextContent("My Requests");
  });
});

describe("pages previously missing language support", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("Sign In shows language selector and localized title", async () => {
    render(
      <MatchingLanguageProvider>
        <SignInPage />
      </MatchingLanguageProvider>
    );

    expect(
      screen.getByRole("button", { name: /select language/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /sign in/i })
    ).toBeInTheDocument();

    await selectLanguage("עברית");
    expect(screen.getByRole("heading", { name: "כניסה" })).toBeInTheDocument();

    await selectLanguage("العربية");
    expect(
      screen.getByRole("heading", { name: "تسجيل الدخول" })
    ).toBeInTheDocument();

    await selectLanguage("English");
    expect(
      screen.getByRole("heading", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  test("Dashboard shows language selector and localized welcome", async () => {
    render(
      <MatchingLanguageProvider>
        <Dashboard />
      </MatchingLanguageProvider>
    );

    expect(
      screen.getByRole("button", { name: /select language/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /welcome, dana/i })
    ).toBeInTheDocument();

    await selectLanguage("עברית");
    expect(
      screen.getByRole("heading", { name: /ברוכה הבאה, dana/i })
    ).toBeInTheDocument();

    await selectLanguage("العربية");
    expect(
      screen.getByRole("heading", { name: /مرحبًا، dana/i })
    ).toBeInTheDocument();
  });

  test("Admin layout shows language selector and localized nav", async () => {
    render(
      <MatchingLanguageProvider>
        <AdminLayout />
      </MatchingLanguageProvider>
    );

    expect(
      screen.getByRole("button", { name: /select language/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^calendar$/i })
    ).toBeInTheDocument();

    await selectLanguage("עברית");
    expect(screen.getByRole("link", { name: "לוח שנה" })).toBeInTheDocument();

    await selectLanguage("العربية");
    expect(screen.getByRole("link", { name: "التقويم" })).toBeInTheDocument();
  });
});
