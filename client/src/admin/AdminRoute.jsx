import React from "react";
import { Navigate } from "react-router-dom";
import { AuthLoadingState } from "../components/auth/ProtectedRoute";
import { useAuth } from "../context/AuthContext";

/**
 * Frontend AdminRoute improves navigation/UX only.
 * Every /api/admin request is still authorized by the backend
 * (authMiddleware → adminMiddleware). Never treat this guard as the
 * security boundary.
 *
 * Reuses the existing AuthContext (user.isAdmin) instead of a separate
 * Admin login or localStorage-based promotion — one auth source of truth.
 */
function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  // Wait until the existing auth state finishes loading before redirecting;
  // otherwise a valid Admin could briefly be treated as unauthenticated.
  if (loading) {
    return <AuthLoadingState label="Checking your session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.isAdmin !== true) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default AdminRoute;
