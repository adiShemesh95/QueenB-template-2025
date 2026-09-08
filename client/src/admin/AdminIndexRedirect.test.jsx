import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import AdminIndexRedirect from "./AdminIndexRedirect";

jest.mock("react-router-dom", () => ({
  Navigate: ({ to, replace }) => (
    <div>
      Navigate to {to}
      {replace ? " (replace)" : ""}
    </div>
  ),
}));

describe("AdminIndexRedirect", () => {
  test("/admin index redirects to /admin/calendar", () => {
    render(<AdminIndexRedirect />);

    expect(
      screen.getByText("Navigate to /admin/calendar (replace)")
    ).toBeInTheDocument();
  });
});
