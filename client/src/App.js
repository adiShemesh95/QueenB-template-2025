import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";

import { ThemeProvider, CssBaseline } from "@mui/material";

import theme from "./theme";

import { AuthProvider } from "./context/AuthContext";

import Home from "./components/home/Home";
import SignUpPage from "./components/auth/SignUpPage";
import SignInPage from "./components/auth/SignInPage";

import ProtectedRoute, { GuestRoute } from "./components/auth/ProtectedRoute";

import Dashboard from "./components/Dashboard";

import MyRequestsPage from "./matching/MyRequestsPage";
import RequestDetailsPage from "./matching/RequestDetailsPage";
import { MatchingLanguageProvider } from "./matching/MatchingLanguageContext";

import MentorsDirectoryPage from "./mentor/MentorsDirectoryPage";
import MentorProfileDetailPage from "./mentor/MentorProfileDetailPage";
import BecomeMentorPage from "./mentor/BecomeMentorPage";
import MentorDashboardPage from "./mentor/MentorDashboardPage";

function MatchingRoutes() {
  return (
    <MatchingLanguageProvider>
      <Outlet />
    </MatchingLanguageProvider>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />

            <Route
              path="/register"
              element={
                <GuestRoute>
                  <SignUpPage />
                </GuestRoute>
              }
            />

            <Route
              path="/login"
              element={
                <GuestRoute>
                  <SignInPage />
                </GuestRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route element={<MatchingRoutes />}>
              <Route
                path="/my-requests"
                element={
                  <ProtectedRoute>
                    <MyRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/matching/:id"
                element={
                  <ProtectedRoute>
                    <RequestDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mentors"
                element={
                  <ProtectedRoute>
                    <MentorsDirectoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mentors/:id"
                element={
                  <ProtectedRoute>
                    <MentorProfileDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/become-mentor"
                element={
                  <ProtectedRoute>
                    <BecomeMentorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mentor-inbox"
                element={
                  <ProtectedRoute>
                    <MentorDashboardPage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
