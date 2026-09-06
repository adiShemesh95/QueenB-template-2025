import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";

const sharedButtonSx = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 0.5,
  minHeight: { xs: 84, sm: 96 },
  px: { xs: 2.5, sm: 3.5 },
  py: 2.25,
  borderRadius: "20px",
  textAlign: "center",
  direction: "ltr",
  transition: "transform 250ms ease, box-shadow 250ms ease",
  "&:hover": {
    transform: "translateY(-2px)",
  },
  "&:focus-visible": {
    outline: "2px solid #F75F8A",
    outlineOffset: "3px",
  },
};

function AuthActions({ t, textDir = "ltr" }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: { xs: 1.5, sm: 2 },
        width: "100%",
        maxWidth: 560,
        mx: "auto",
        mt: { xs: 3, sm: 3.5 },
        // Lock visual order: Sign Up left, Log In right (same in every language).
        direction: "ltr",
      }}
    >
      <Button
        component={RouterLink}
        to="/register"
        aria-label={t.signUpAria}
        sx={{
          ...sharedButtonSx,
          background: "linear-gradient(135deg, #FF6F91 0%, #F75F8A 55%, #E04872 100%)",
          color: "#FFFFFF",
          boxShadow: "0 10px 28px rgba(247, 95, 138, 0.28)",
          "&:hover": {
            ...sharedButtonSx["&:hover"],
            background:
              "linear-gradient(135deg, #FF7A9A 0%, #F75F8A 55%, #D93F68 100%)",
            boxShadow: "0 14px 32px rgba(247, 95, 138, 0.36)",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            direction: "ltr",
          }}
        >
          <PersonAddAlt1OutlinedIcon sx={{ fontSize: 26 }} />
          <Typography
            component="span"
            dir={textDir}
            sx={{ fontSize: { xs: "1.2rem", sm: "1.35rem" }, fontWeight: 700 }}
          >
            {t.signUp}
          </Typography>
        </Box>
        <Typography
          component="span"
          dir={textDir}
          sx={{
            fontSize: "0.875rem",
            fontWeight: 400,
            opacity: 0.92,
          }}
        >
          {t.signUpSub}
        </Typography>
      </Button>

      <Button
        component={RouterLink}
        to="/login"
        aria-label={t.logInAria}
        variant="outlined"
        sx={{
          ...sharedButtonSx,
          backgroundColor: "rgba(255, 255, 255, 0.72)",
          border: "1.5px solid #F75F8A",
          color: "#F75F8A",
          backdropFilter: "blur(8px)",
          boxShadow: "0 6px 20px rgba(7, 20, 45, 0.04)",
          "&:hover": {
            ...sharedButtonSx["&:hover"],
            backgroundColor: "rgba(255, 255, 255, 0.92)",
            border: "1.5px solid #F75F8A",
            boxShadow: "0 10px 28px rgba(7, 20, 45, 0.08)",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            direction: "ltr",
          }}
        >
          <LoginOutlinedIcon sx={{ fontSize: 26, color: "#F75F8A" }} />
          <Typography
            component="span"
            dir={textDir}
            sx={{
              fontSize: { xs: "1.2rem", sm: "1.35rem" },
              fontWeight: 700,
              color: "#F75F8A",
            }}
          >
            {t.logIn}
          </Typography>
        </Box>
        <Typography
          component="span"
          dir={textDir}
          sx={{
            fontSize: "0.875rem",
            fontWeight: 400,
            color: "#6B7280",
          }}
        >
          {t.logInSub}
        </Typography>
      </Button>
    </Box>
  );
}

export default AuthActions;
