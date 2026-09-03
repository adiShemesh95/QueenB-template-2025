import React from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import Home from "./components/home/Home";
import AuthPlaceholder from "./components/home/AuthPlaceholder";
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
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<AuthPlaceholder mode="register" />} />
          <Route path="/login" element={<AuthPlaceholder mode="login" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route element={<MatchingRoutes />}>
            <Route path="/my-requests" element={<MyRequestsPage />} />
            <Route path="/matching/:id" element={<RequestDetailsPage />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
