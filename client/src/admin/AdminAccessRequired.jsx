import React from "react";
import { Alert, Box, Button, Typography } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAdminLanguage } from "./translations";

/**
 * Shown when an authenticated non-admin reaches /admin.
 * Frontend UX only — backend adminMiddleware still returns 403 on /api/admin/*.
 */
function AdminAccessRequired() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { language, dir, t } = useAdminLanguage();
  const [signingOut, setSigningOut] = React.useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <Box
      dir={dir}
      lang={language}
      sx={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
        py: 4,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          border: "1px solid rgba(247, 95, 138, 0.12)",
          boxShadow: "0 12px 40px rgba(7, 20, 45, 0.08)",
          textAlign: "center",
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#07142D",
            mb: 1.5,
          }}
        >
          {t.accessRequiredTitle}
        </Typography>
        <Alert severity="warning" sx={{ borderRadius: 2, mb: 2.5, textAlign: "left" }}>
          {t.accessRequiredAlert}
        </Alert>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Button
            component={RouterLink}
            to="/dashboard"
            variant="contained"
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 999,
              backgroundColor: "#F75F8A",
              boxShadow: "none",
              "&:hover": {
                backgroundColor: "#E04872",
                boxShadow: "none",
              },
            }}
          >
            {t.continueToApp}
          </Button>
          <Button
            onClick={handleSignOut}
            disabled={signingOut}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "#4A5568",
            }}
          >
            {signingOut ? t.signingOut : t.signInDifferentAccount}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default AdminAccessRequired;
