import React, { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import UserManagement from "./UserManagement";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const handleLogout = async () => {
    if (loggingOut) return;
    setLogoutError("");
    setLoggingOut(true);
    try {
      await logout();
      navigate("/");
    } catch {
      setLogoutError("Unable to log out right now. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={2}>
        <Toolbar sx={{ gap: 1.5 }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            👑 QueenB - Example Bar
          </Typography>
          {user?.username ? (
            <Typography variant="body2" sx={{ opacity: 0.95 }}>
              {user.username}
            </Typography>
          ) : null}
          <Button
            component={RouterLink}
            to="/"
            color="inherit"
            sx={{ textTransform: "none" }}
          >
            Home
          </Button>
          <Button
            onClick={handleLogout}
            disabled={loggingOut}
            color="inherit"
            variant="outlined"
            sx={{
              textTransform: "none",
              borderColor: "rgba(255,255,255,0.7)",
            }}
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </Button>
        </Toolbar>
      </AppBar>
      {logoutError ? (
        <Typography sx={{ color: "#B42318", px: 4, pt: 2 }}>
          {logoutError}
        </Typography>
      ) : null}
      <UserManagement />
    </Box>
  );
}

export default Dashboard;
