import React, { useState } from "react";
import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import LanguageSelector from "./LanguageSelector";
import { useAuth } from "../../context/AuthContext";

function Navbar({ language, onLanguageChange, t }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

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
      position="absolute"
      elevation={0}
      color="transparent"
      sx={{
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "transparent",
        boxShadow: "none",
      }}
    >
      <Toolbar
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 1, sm: 1.25 },
          minHeight: { xs: 56, sm: 64 },
          justifyContent: "flex-end",
          gap: { xs: 1, sm: 1.5 },
          maxWidth: 1200,
          width: "100%",
          mx: "auto",
          // Keep language selector fixed in the top-right.
          direction: "ltr",
        }}
      >
        {user ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.75, sm: 1.25 },
              mr: { xs: 0.5, sm: 1 },
            }}
          >
            <Typography
              sx={{
                display: { xs: "none", sm: "block" },
                color: "#07142D",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              {user.username}
            </Typography>
            <Button
              component={RouterLink}
              to="/dashboard"
              size="small"
              sx={{
                color: "#07142D",
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              Dashboard
            </Button>
            <Button
              onClick={handleLogout}
              disabled={loggingOut}
              size="small"
              variant="outlined"
              sx={{
                borderColor: "#F75F8A",
                color: "#F75F8A",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                "&:hover": {
                  borderColor: "#E04872",
                  backgroundColor: "rgba(247, 95, 138, 0.06)",
                },
              }}
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </Button>
            {logoutError ? (
              <Typography
                component="span"
                sx={{
                  position: "absolute",
                  top: "100%",
                  right: { xs: 16, sm: 24 },
                  mt: 0.5,
                  color: "#B42318",
                  fontSize: "0.75rem",
                }}
              >
                {logoutError}
              </Typography>
            ) : null}
          </Box>
        ) : null}

        <LanguageSelector
          language={language}
          onLanguageChange={onLanguageChange}
          ariaLabel={t.languageAria}
        />
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
