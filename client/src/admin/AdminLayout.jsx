import React from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link as RouterLink, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
];

// Calendar and Admin Alerts are intentionally omitted from Stage 5 —
// Calendar is a later stage; Alerts are owned by another teammate.

// NavLink applies the "active" class; MUI sx targets it for highlight styles.
const navButtonSx = {
  textTransform: "none",
  fontWeight: 600,
  fontSize: { xs: "0.8rem", sm: "0.875rem" },
  px: { xs: 1.25, sm: 1.75 },
  py: 0.75,
  borderRadius: 999,
  minWidth: 0,
  color: "#07142D",
  backgroundColor: "transparent",
  "&.active": {
    color: "#D93F68",
    backgroundColor: "rgba(247, 95, 138, 0.12)",
  },
  "&:hover": {
    backgroundColor: "rgba(247, 95, 138, 0.1)",
    color: "#D93F68",
  },
};
/**
 * Admin shell kept under client/src/admin so Admin navigation lives here
 * instead of expanding the shared AppNavbar (lower merge-conflict risk).
 */
function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      navigate("/");
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
        sx={{
          backgroundColor: "rgba(255, 255, 255, 0.88)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(7, 20, 45, 0.08)",
          color: "#07142D",
        }}
      >
        <Toolbar
          sx={{
            gap: { xs: 1, sm: 2 },
            flexWrap: "wrap",
            py: { xs: 1, sm: 0.5 },
            minHeight: { xs: "auto", sm: 64 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mr: 1 }}>
            <Typography
              component="span"
              sx={{
                fontWeight: 800,
                fontSize: { xs: "0.95rem", sm: "1.05rem" },
                color: "#07142D",
                letterSpacing: "-0.02em",
              }}
            >
              Queens Match
            </Typography>
            <Typography
              component="span"
              sx={{
                fontWeight: 700,
                fontSize: "0.7rem",
                px: 1,
                py: 0.35,
                borderRadius: 999,
                backgroundColor: "rgba(247, 95, 138, 0.14)",
                color: "#D93F68",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Admin
            </Typography>
          </Box>

          <Box
            component="nav"
            aria-label="Admin"
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 0.5,
              flex: 1,
            }}
          >
            {navItems.map((item) => (
              <Button
                key={item.to}
                component={NavLink}
                to={item.to}
                end={Boolean(item.end)}
                sx={navButtonSx}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              ml: "auto",
            }}
          >
            <Typography
              sx={{
                display: { xs: "none", sm: "block" },
                color: "#4A5568",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              {user?.username}
            </Typography>
            <Button
              component={RouterLink}
              to="/dashboard"
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: "#4A5568",
                fontSize: "0.85rem",
              }}
            >
              Exit Admin
            </Button>
            <Button
              onClick={handleLogout}
              disabled={loggingOut}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: "#D93F68",
                fontSize: "0.85rem",
              }}
            >
              {loggingOut ? "Logging out…" : "Logout"}
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
    </Box>
  );
}

export default AdminLayout;
