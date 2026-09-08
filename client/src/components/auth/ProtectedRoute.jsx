import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function AuthLoadingState({ label = "Loading..." }) {
  return (
    <Box
      sx={{
        minHeight: "50vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
      }}
    >
      <CircularProgress size={28} sx={{ color: "#F75F8A" }} />
      <Typography sx={{ color: "#6B7280" }}>{label}</Typography>
    </Box>
  );
}

// Blocks unauthenticated users from private pages (e.g. dashboard).
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingState label="Checking your session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function getAdminReturnPath(from) {
  if (typeof from === "string" && from.startsWith("/admin")) {
    return from;
  }
  return "/admin";
}

// Keeps logged-in users off guest-only pages (home, sign up, sign in).
function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoadingState label="Checking your session..." />;
  }

  if (user) {
    // When AuthContext setUser() runs after Sign In, this guard re-renders
    // immediately. Honor Admin entry intent from router state so we do not
    // override SignInPage with a normal-user /dashboard redirect.
    if (location.state?.adminIntent === true) {
      return (
        <Navigate to={getAdminReturnPath(location.state?.from)} replace />
      );
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export { ProtectedRoute, GuestRoute, AuthLoadingState };
export default ProtectedRoute;
