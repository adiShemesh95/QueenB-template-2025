import React from "react";
import { Box, Typography } from "@mui/material";
import AuthActions from "./AuthActions";

function HeroSection({ t, textDir = "ltr" }) {
  return (
    <Box
      component="section"
      aria-labelledby="hero-heading"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        direction: "ltr",
        pt: { xs: 9, sm: 10, md: 11 },
        pb: { xs: 2, sm: 2.5 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Typography
        id="hero-heading"
        component="h1"
        dir={textDir}
        sx={{
          fontSize: {
            xs: "2.2rem",
            sm: "3.1rem",
            md: "3.65rem",
            lg: "4rem",
          },
          fontWeight: 700,
          lineHeight: 1.18,
          letterSpacing: "-0.025em",
          color: "#07142D",
          maxWidth: 720,
        }}
      >
        {t.heroLine1}
        <br />
        {t.heroLine2}
        <br />
        <Box
          component="span"
          sx={{
            position: "relative",
            display: "inline-block",
            color: "#F75F8A",
          }}
        >
          {t.connections}
          <Box
            component="svg"
            viewBox="0 0 220 12"
            aria-hidden="true"
            sx={{
              position: "absolute",
              left: "50%",
              bottom: { xs: -6, sm: -8 },
              transform: "translateX(-50%)",
              width: "100%",
              height: { xs: 8, sm: 10 },
              overflow: "visible",
            }}
          >
            <path
              d="M4 7 C 50 1, 110 11, 160 5 S 200 2, 216 6"
              fill="none"
              stroke="#F75F8A"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.85"
            />
          </Box>
        </Box>
      </Typography>

      <Typography
        component="p"
        dir={textDir}
        sx={{
          mt: { xs: 2, sm: 2.5 },
          maxWidth: 480,
          fontSize: { xs: "1rem", sm: "1.1rem" },
          lineHeight: 1.65,
          color: "#4A5568",
          fontWeight: 400,
        }}
      >
        {t.heroSubtitle}
      </Typography>

      <AuthActions t={t} textDir={textDir} />
    </Box>
  );
}

export default HeroSection;
