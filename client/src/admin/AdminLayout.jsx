import React from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link as RouterLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import BootcampFooter from "../components/BootcampFooter";

const pageBackground = `
  radial-gradient(ellipse 80% 55% at 0% 0%, rgba(141, 216, 247, 0.35) 0%, transparent 55%),
  radial-gradient(ellipse 70% 50% at 100% 20%, rgba(255, 182, 201, 0.28) 0%, transparent 50%),
  radial-gradient(ellipse 60% 45% at 85% 100%, rgba(230, 214, 255, 0.3) 0%, transparent 45%),
  linear-gradient(160deg, #EAF7FD 0%, #F9FBFF 42%, #FDF2F6 100%)
`;

const navItems = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/matchings", label: "Matchings" },
  { to: "/admin/calendar", label: "Calendar" },
];

// Admin Alerts are intentionally omitted — owned by another teammate.

// Mirrors AppNavbar navPillSx so Admin keeps the same active/hover language
// without refactoring the shared authenticated navbar.
const navPillSx = (active) => ({
  textTransform: "none",
  fontWeight: 600,
  fontSize: { xs: "0.8rem", sm: "0.875rem" },
  px: { xs: 1.25, sm: 1.75 },
  py: 0.75,
  borderRadius: 999,
  minWidth: 0,
  color: active ? "#D93F68" : "#07142D",
  backgroundColor: active ? "rgba(247, 95, 138, 0.12)" : "transparent",
  "&:hover": {
    backgroundColor: "rgba(247, 95, 138, 0.1)",
    color: "#D93F68",
  },
});

function getUsernameInitials(username) {
  const name = String(username || "").trim();
  if (!name) return "?";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function isAdminNavActive(pathname, to, end) {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

/**
 * Admin shell kept under client/src/admin so Admin navigation lives here
 * instead of expanding the shared AppNavbar (lower merge-conflict risk).
 * Visual styling deliberately mirrors AppNavbar; behavior stays Admin-local.
 */
function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const username = user?.username || "";
  const initials = getUsernameInitials(username);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      // Preserve Admin entry intent so re-login returns to /admin (or denies
      // non-admins) instead of treating this as a normal-user logout.
      navigate("/login", {
        replace: true,
        state: { adminIntent: true, from: "/admin" },
      });
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: pageBackground,
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        color="transparent"
        sx={{
          top: 0,
          backgroundColor: "rgba(255, 255, 255, 0.72)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(7, 20, 45, 0.06)",
          boxShadow: "0 4px 18px rgba(7, 20, 45, 0.04)",
          color: "#07142D",
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
            flexWrap: "wrap",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              minWidth: 0,
            }}
          >
            <Logo />
            <Typography
              component="span"
              aria-label="Admin mode"
              sx={{
                fontWeight: 700,
                fontSize: "0.65rem",
                px: 1,
                py: 0.35,
                borderRadius: 999,
                backgroundColor: "rgba(247, 95, 138, 0.14)",
                color: "#D93F68",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                flexShrink: 0,
              }}
            >
              Admin
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.5, sm: 1 },
              flexWrap: "wrap",
              justifyContent: "flex-end",
              ml: { xs: 0, sm: "auto" },
            }}
          >
            <Box
              component="nav"
              aria-label="Admin"
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
              {navItems.map((item) => {
                const active = isAdminNavActive(
                  location.pathname,
                  item.to,
                  Boolean(item.end)
                );
                return (
                  <Button
                    key={item.to}
                    component={RouterLink}
                    to={item.to}
                    sx={navPillSx(active)}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
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
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          flex: 1,
          py: { xs: 3, sm: 4 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Container maxWidth="lg" disableGutters>
          <Outlet />
        </Container>
      </Box>
      <BootcampFooter />
    </Box>
  );
}

export default AdminLayout;
