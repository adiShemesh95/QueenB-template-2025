import React from "react";
import { Navigate } from "react-router-dom";

/** Sends /admin to Calendar so Overview is not needed as a separate landing page. */
function AdminIndexRedirect() {
  return <Navigate to="/admin/calendar" replace />;
}

export default AdminIndexRedirect;
