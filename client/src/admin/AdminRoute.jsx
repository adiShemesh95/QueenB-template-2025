import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthLoadingState } from "../components/auth/ProtectedRoute";
import { useAuth } from "../context/AuthContext";
import AdminAccessRequired from "./AdminAccessRequired";

/**
 * Frontend AdminRoute improves navigation/UX only.
 * Every /api/admin request is still authorized by the backend
 * (authMiddleware → adminMiddleware). Never treat this guard as the
 * security boundary.
 *
 * Reuses the existing AuthContext (user.isAdmin) instead of a separate
 * Admin login or localStorage-based promotion — one auth source of truth.
 *
 * Unauthenticated visitors are sent to /login with adminIntent + from so
 * SignIn can return Admins to /admin instead of the regular dashboard.
 */
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Wait until the existing auth state finishes loading before redirecting;
  // otherwise a valid Admin could briefly be treated as unauthenticated.
  if (loading) {
    return <AuthLoadingState label="Checking your session..." />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          adminIntent: true,
          from: `${location.pathname}${location.search}`,
        }}
      />
    );
  }

  // Do not auto-send non-admins into mentor/mentee pages from the Admin entry.
  // Backend still enforces 403 on /api/admin/* regardless of this UI.
  if (user.isAdmin !== true) {
    return <AdminAccessRequired />;
  }

  return children;
}

export default AdminRoute;
