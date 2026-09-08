import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
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

// Admin frontend — isolated under client/src/admin.
// Admin Alerts are intentionally not wired here (owned by another teammate).
import AdminRoute from "./admin/AdminRoute";
import AdminLayout from "./admin/AdminLayout";
import AdminIndexRedirect from "./admin/AdminIndexRedirect";
import AdminUsersPage from "./admin/AdminUsersPage";
import AdminUserDetailsPage from "./admin/AdminUserDetailsPage";
import AdminMatchingsPage from "./admin/AdminMatchingsPage";
import AdminMatchingDetailsPage from "./admin/AdminMatchingDetailsPage";
import AdminCalendarPage from "./admin/AdminCalendarPage";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AuthProvider>
        <MatchingLanguageProvider>
          <Router>
            <Routes>
              <Route
                path="/"
                element={
                  <GuestRoute>
                    <Home />
                  </GuestRoute>
                }
              />

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

              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<AdminIndexRedirect />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="users/:id" element={<AdminUserDetailsPage />} />
                <Route path="matchings" element={<AdminMatchingsPage />} />
                <Route
                  path="matchings/:id"
                  element={<AdminMatchingDetailsPage />}
                />
                <Route path="calendar" element={<AdminCalendarPage />} />
              </Route>
            </Routes>
          </Router>
        </MatchingLanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
