import React, { useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import LanguageSelector from "./home/LanguageSelector";
import { useAuth } from "../context/AuthContext";

function getUsernameInitials(username) {
  const name = String(username || "").trim();
  if (!name) return "?";

  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

const navPillSx = (active) => ({
  textTransform: "none",
  fontWeight: 600,
  fontSize: { xs: "0.8rem", sm: "0.875rem" },
  px: { xs: 1.25, sm: 1.75 },
  py: 0.75,
  borderRadius: 999,
  minWidth: 0,
  color: active ? "#D93F68" : "#07142D",
  backgroundColor: active
    ? "rgba(247, 95, 138, 0.12)"
    : "transparent",
  "&:hover": {
    backgroundColor: "rgba(247, 95, 138, 0.1)",
    color: "#D93F68",
  },
});

/**
 * Shared authenticated app navbar.
 * On /dashboard: Logo + My Requests + Mentor Inbox + user + Logout
 * Elsewhere: also shows Browse Mentors + Become Mentor
 */
function AppNavbar({ language, onLanguageChange, languageAria }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const isDashboard = location.pathname === "/dashboard";
  const username = user?.username || "";
  const initials = getUsernameInitials(username);
  const showLanguage =
    typeof language === "string" && typeof onLanguageChange === "function";

  const links = [
    ...(!isDashboard
      ? [
          { to: "/mentors", label: "Browse Mentors" },
          { to: "/become-mentor", label: "Become Mentor" },
        ]
      : []),
    { to: "/my-requests", label: "My Requests" },
    { to: "/mentor-inbox", label: "Mentor Inbox" },
  ];

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
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      dir="ltr"
      sx={{
        top: 0,
        backgroundColor: "rgba(255, 255, 255, 0.72)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(7, 20, 45, 0.06)",
        boxShadow: "0 4px 18px rgba(7, 20, 45, 0.04)",
        direction: "ltr",
      }}
    >
      <Toolbar
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 0.75, sm: 1 },
          minHeight: { xs: 64, sm: 72 },
          maxWidth: 1100,
          width: "100%",
          mx: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: { xs: 1, sm: 2 },
          direction: "ltr",
        }}
      >
        <Logo />

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.5, sm: 1 },
            flexWrap: "wrap",
            justifyContent: "flex-end",
            direction: "ltr",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.25,
              flexWrap: "wrap",
              p: 0.35,
              borderRadius: 999,
              backgroundColor: "rgba(255, 255, 255, 0.55)",
              border: "1px solid rgba(247, 95, 138, 0.1)",
            }}
          >
            {links.map((link) => {
              const active =
                location.pathname === link.to ||
                (link.to !== "/dashboard" &&
                  location.pathname.startsWith(`${link.to}/`));

              return (
                <Button
                  key={link.to}
                  component={RouterLink}
                  to={link.to}
                  sx={navPillSx(active)}
                >
                  {link.label}
                </Button>
              );
            })}
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              direction: "ltr",
              py: 0.5,
              px: { xs: 0.75, sm: 1.25 },
              borderRadius: 999,
              backgroundColor: "rgba(247, 95, 138, 0.08)",
            }}
          >
            <Avatar
              alt=""
              sx={{
                width: 32,
                height: 32,
                bgcolor: "rgba(247, 95, 138, 0.18)",
                color: "#F75F8A",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              {initials}
            </Avatar>
            <Typography
              sx={{
                display: { xs: "none", sm: "block" },
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#07142D",
                maxWidth: 120,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {username}
            </Typography>
          </Box>

          <Button
            onClick={handleLogout}
            disabled={loggingOut}
            size="small"
            variant="outlined"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 999,
              px: 1.75,
              borderColor: "#F75F8A",
              color: "#F75F8A",
              "&:hover": {
                borderColor: "#E04872",
                backgroundColor: "rgba(247, 95, 138, 0.06)",
              },
            }}
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </Button>

          {showLanguage ? (
            <LanguageSelector
              language={language}
              onLanguageChange={onLanguageChange}
              ariaLabel={languageAria || "Select language"}
            />
          ) : null}
        </Box>
      </Toolbar>

      {logoutError ? (
        <Typography
          sx={{
            px: { xs: 2, sm: 3, md: 4 },
            pb: 1,
            maxWidth: 1100,
            width: "100%",
            mx: "auto",
            color: "#B42318",
            fontSize: "0.8rem",
          }}
        >
          {logoutError}
        </Typography>
      ) : null}
    </AppBar>
  );
}

export default AppNavbar;
