import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { Navigate } from "react-router-dom";
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

function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingState label="Checking your session..." />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export { ProtectedRoute, GuestRoute, AuthLoadingState };
export default ProtectedRoute;
