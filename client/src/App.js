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
              <Route path="/my-requests" element={<MyRequestsPage />} />
              <Route path="/matching/:id" element={<RequestDetailsPage />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;