import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

/**
 * Lightweight placeholder until auth pages are implemented.
 * Keeps navigation from the landing page working without broken routes.
 */
function AuthPlaceholder({ mode }) {
  const isRegister = mode === "register";

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        px: 3,
        textAlign: "center",
        background:
          "linear-gradient(160deg, #EAF7FD 0%, #F9FBFF 45%, #FDF2F6 100%)",
      }}
    >
      <Typography
        component="h1"
        sx={{ fontSize: "1.75rem", fontWeight: 700, color: "#07142D" }}
      >
        {isRegister ? "הרשמה" : "כניסה"}
      </Typography>
      <Typography sx={{ color: "#6B7280", maxWidth: 360 }}>
        {isRegister
          ? "דף ההרשמה יהיה זמין בקרוב."
          : "דף הכניסה יהיה זמין בקרוב."}
      </Typography>
      <Button
        component={RouterLink}
        to="/"
        variant="contained"
        sx={{
          mt: 1,
          px: 3,
          py: 1.25,
          borderRadius: 3,
          background: "linear-gradient(135deg, #FF6F91, #F75F8A)",
          boxShadow: "0 8px 20px rgba(247, 95, 138, 0.25)",
        }}
      >
        חזרה לדף הבית
      </Button>
    </Box>
  );
}

export default AuthPlaceholder;
