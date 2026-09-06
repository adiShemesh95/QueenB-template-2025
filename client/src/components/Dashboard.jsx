import React, { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import UserManagement from "./UserManagement";
import { useAuth } from "../context/AuthContext";

const navLinkSx = {
  textTransform: "none",
  color: "inherit",
  fontWeight: 600,
};

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
        <Toolbar sx={{ gap: 1.5, flexWrap: "wrap" }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            👑 QueenB - Example Bar
          </Typography>
          {user?.username ? (
            <Typography variant="body2" sx={{ opacity: 0.95 }}>
              {user.username}
            </Typography>
          ) : null}
          <Button component={RouterLink} to="/" sx={navLinkSx}>
            Home
          </Button>
          <Button component={RouterLink} to="/mentors" sx={navLinkSx}>
            Mentors
          </Button>
          <Button component={RouterLink} to="/my-requests" sx={navLinkSx}>
            My Requests
          </Button>
          <Button component={RouterLink} to="/mentor-inbox" sx={navLinkSx}>
            Mentor Inbox
          </Button>
          <Button component={RouterLink} to="/become-mentor" sx={navLinkSx}>
            Become Mentor
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
      <Box sx={{ px: { xs: 2, sm: 4 }, pt: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ mb: 2 }}
        >
          <Button
            component={RouterLink}
            to="/mentors"
            variant="contained"
            sx={{
              borderRadius: 3,
              background: "linear-gradient(135deg, #FF6F91, #F75F8A)",
              boxShadow: "0 8px 20px rgba(247, 95, 138, 0.22)",
            }}
          >
            Browse mentors
          </Button>
          <Button
            component={RouterLink}
            to="/become-mentor"
            variant="outlined"
            sx={{
              borderRadius: 3,
              borderColor: "#F75F8A",
              color: "#F75F8A",
            }}
          >
            Become a mentor
          </Button>
          <Button
            component={RouterLink}
            to="/mentor-inbox"
            variant="outlined"
            sx={{ borderRadius: 3 }}
          >
            Mentor inbox
          </Button>
          <Button
            component={RouterLink}
            to="/my-requests"
            variant="outlined"
            sx={{ borderRadius: 3 }}
          >
            My requests
          </Button>
        </Stack>
      </Box>
      <UserManagement />
    </Box>
  );
}

export default Dashboard;
