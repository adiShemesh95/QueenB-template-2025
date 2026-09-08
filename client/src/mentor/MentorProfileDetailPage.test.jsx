import React from "react";
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import MentorProfileDetailPage from "./MentorProfileDetailPage";
import { MatchingLanguageProvider } from "../matching/MatchingLanguageContext";
import { getMentorById } from "./mentorService";
import { trackProfileViewed } from "../analytics/analyticsClient";

const mockNavigate = jest.fn();
const mockParams = { current: { id: "12" } };
const mockSearchParams = { current: new URLSearchParams("source=whatsapp") };

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: 99, username: "mentee" } }),
}));

jest.mock("./mentorService", () => ({
  getMentorById: jest.fn(),
  requestMentorship: jest.fn(),
}));

jest.mock("../analytics/analyticsClient", () => ({
  trackProfileViewed: jest.fn(),
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
    useParams: () => mockParams.current,
    useSearchParams: () => [mockSearchParams.current, jest.fn()],
    useLocation: () => ({
      pathname: `/mentors/${mockParams.current.id}`,
      search: mockSearchParams.current.toString()
        ? `?${mockSearchParams.current.toString()}`
        : "",
    }),
  };
});

jest.mock("./MentorLayout", () => {
  const React = require("react");
  return function MockMentorLayout({ children }) {
    return React.createElement("div", { "data-testid": "mentor-layout" }, children);
  };
});

const mentor = {
  id: 12,
  userId: 44,
  username: "mentor_anna",
  job: "Engineer",
  company: "Acme",
  techStack: ["React"],
  topics: ["Career Planning"],
  isActive: true,
};

function renderPage() {
  return render(
    <MatchingLanguageProvider>
      <MentorProfileDetailPage />
    </MatchingLanguageProvider>
  );
}

describe("MentorProfileDetailPage analytics", () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockNavigate.mockReset();
    mockParams.current = { id: "12" };
    mockSearchParams.current = new URLSearchParams("source=whatsapp");
    getMentorById.mockReset();
    trackProfileViewed.mockReset();
    trackProfileViewed.mockResolvedValue({ id: 1 });
  });

  test("successful mentor load records one profile view with source", async () => {
    getMentorById.mockResolvedValue(mentor);
    renderPage();

    await waitFor(() =>
      expect(screen.getByText("mentor_anna")).toBeInTheDocument()
    );
    await waitFor(() => expect(trackProfileViewed).toHaveBeenCalledTimes(1));
    expect(trackProfileViewed).toHaveBeenCalledWith(
      expect.objectContaining({
        mentorUserId: 44,
        source: "whatsapp",
      })
    );
  });

  test("rerender does not create duplicate tracking", async () => {
    getMentorById.mockResolvedValue(mentor);
    const { rerender } = renderPage();

    await waitFor(() => expect(trackProfileViewed).toHaveBeenCalledTimes(1));

    rerender(
      <MatchingLanguageProvider>
        <MentorProfileDetailPage />
      </MatchingLanguageProvider>
    );

    await waitFor(() =>
      expect(screen.getByText("mentor_anna")).toBeInTheDocument()
    );
    expect(trackProfileViewed).toHaveBeenCalledTimes(1);
  });

  test("failed mentor load does not create profile view event", async () => {
    getMentorById.mockResolvedValue(null);
    renderPage();

    await waitFor(() =>
      expect(screen.getByText(/mentor not found/i)).toBeInTheDocument()
    );
    expect(trackProfileViewed).not.toHaveBeenCalled();
  });

  test("share links include mentor id and source", async () => {
    mockSearchParams.current = new URLSearchParams();
    getMentorById.mockResolvedValue(mentor);
    renderPage();

    await waitFor(() =>
      expect(screen.getByRole("link", { name: /whatsapp/i })).toBeInTheDocument()
    );

    const whatsapp = screen.getByRole("link", { name: /whatsapp/i });
    const linkedin = screen.getByRole("link", { name: /linkedin/i });
    expect(decodeURIComponent(whatsapp.getAttribute("href"))).toContain(
      "/mentors/12?source=whatsapp"
    );
    expect(decodeURIComponent(linkedin.getAttribute("href"))).toContain(
      "/mentors/12?source=linkedin"
    );
  });
});
