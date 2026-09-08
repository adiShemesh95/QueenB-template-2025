import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BecomeMentorPage from "./BecomeMentorPage";
import { MatchingLanguageProvider } from "../matching/MatchingLanguageContext";
import * as mentorService from "./mentorService";

jest.mock("./mentorService", () => ({
  MENTOR_TOPICS: [
    "Mock Interview",
    "Career Planning",
    "Company Guidance",
    "Resume Review",
    "Tech Skills",
  ],
  getMyMentorProfile: jest.fn(),
  saveMentorProfile: jest.fn(),
}));

const mockNavigate = jest.fn();

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 2, username: "mentorUser", isAdmin: false },
    logout: jest.fn(),
  }),
}));

jest.mock("../components/Logo", () => {
  const React = require("react");
  return function MockLogo() {
    return React.createElement("div", null, "Queens Match");
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
    useLocation: () => ({ pathname: "/become-mentor" }),
    useNavigate: () => mockNavigate,
  };
});

function renderPage() {
  return render(
    <MatchingLanguageProvider>
      <BecomeMentorPage />
    </MatchingLanguageProvider>
  );
}

const existingProfile = {
  id: 55,
  job: "Engineer",
  company: "AppsFlyer",
  yearsExperience: 4,
  techStack: ["React", "Node"],
  background: "Backend and mentoring",
  profileImageUrl: "https://example.com/photo.jpg",
  maxSessions: 5,
  sessionDuration: 60,
  topics: ["Career Planning"],
  isActive: true,
};

describe("BecomeMentorPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.setItem("queenb-matching-language", "en");
    mockNavigate.mockReset();
  });

  test("prefills existing mentor profile", async () => {
    mentorService.getMyMentorProfile.mockResolvedValue(existingProfile);
    renderPage();

    expect(await screen.findByDisplayValue("Engineer")).toBeInTheDocument();
    expect(screen.getByDisplayValue("AppsFlyer")).toBeInTheDocument();
    expect(screen.getByDisplayValue("4")).toBeInTheDocument();
    expect(screen.getByDisplayValue("React, Node")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Backend and mentoring")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: /show my profile in the mentors directory/i,
      })
    ).toBeChecked();
    expect(
      screen.getByRole("button", { name: /save changes/i })
    ).toBeInTheDocument();
  });

  test("required-field validation blocks submit", async () => {
    mentorService.getMyMentorProfile.mockResolvedValue(null);
    renderPage();

    expect(
      await screen.findByRole("button", { name: /publish mentor profile/i })
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /publish mentor profile/i })
    );

    expect(await screen.findByText(/job title is required/i)).toBeInTheDocument();
    expect(screen.getByText(/company is required/i)).toBeInTheDocument();
    expect(screen.getByText(/select at least one topic/i)).toBeInTheDocument();
    expect(mentorService.saveMentorProfile).not.toHaveBeenCalled();
  });

  test("save calls saveMentorProfile with form payload", async () => {
    mentorService.getMyMentorProfile.mockResolvedValue(existingProfile);
    mentorService.saveMentorProfile.mockResolvedValue({
      ...existingProfile,
      isActive: true,
    });
    renderPage();

    const jobInput = await screen.findByLabelText(/job title/i);
    fireEvent.change(jobInput, { target: { value: "Staff Engineer" } });

    await userEvent.click(
      screen.getByRole("button", { name: /save changes/i })
    );

    await waitFor(() =>
      expect(mentorService.saveMentorProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          job: "Staff Engineer",
          company: "AppsFlyer",
          yearsExperience: 4,
          topics: ["Career Planning"],
          techStack: ["React", "Node"],
          sessionDuration: 60,
          maxSessions: 5,
          isActive: true,
        })
      )
    );
  });

  test("hiding profile saves isActive false without navigating to public profile", async () => {
    mentorService.getMyMentorProfile.mockResolvedValue(existingProfile);
    mentorService.saveMentorProfile.mockResolvedValue({
      ...existingProfile,
      isActive: false,
    });
    renderPage();

    const visibility = await screen.findByRole("checkbox", {
      name: /show my profile in the mentors directory/i,
    });
    await userEvent.click(visibility);
    expect(visibility).not.toBeChecked();

    await userEvent.click(
      screen.getByRole("button", { name: /save changes/i })
    );

    await waitFor(() =>
      expect(mentorService.saveMentorProfile).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false })
      )
    );
    expect(
      await screen.findByText(/your mentor profile was updated/i)
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
