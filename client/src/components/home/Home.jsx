import React, { useState } from "react";
import { Box } from "@mui/material";
import Navbar from "./Navbar";
import HeroSection from "./HeroSection";
import FeaturesSection from "./FeaturesSection";
import QuoteSection from "./QuoteSection";
import WaveDivider from "./WaveDivider";
import BootcampFooter from "./BootcampFooter";
import translations from "./translations";

function Home() {
  const [language, setLanguage] = useState("en");
  const textDir = language === "he" ? "rtl" : "ltr";
  const t = translations[language] || translations.en;

  return (
    <Box
      component="main"
      // Layout stays LTR always — language switch must not mirror/reorder UI.
      dir="ltr"
      lang={language}
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflowX: "hidden",
        direction: "ltr",
        background: `
          radial-gradient(ellipse 80% 55% at 0% 0%, rgba(141, 216, 247, 0.35) 0%, transparent 55%),
          radial-gradient(ellipse 70% 50% at 100% 20%, rgba(255, 182, 201, 0.28) 0%, transparent 50%),
          radial-gradient(ellipse 60% 45% at 85% 100%, rgba(230, 214, 255, 0.3) 0%, transparent 45%),
          linear-gradient(160deg, #EAF7FD 0%, #F9FBFF 42%, #FDF2F6 100%)
        `,
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: { xs: "8%", md: "12%" },
          left: { xs: "-10%", md: "5%" },
          width: { xs: 180, md: 280 },
          height: { xs: 180, md: 280 },
          borderRadius: "50%",
          background: "rgba(141, 216, 247, 0.35)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: { xs: "35%", md: "28%" },
          right: { xs: "-8%", md: "8%" },
          width: { xs: 160, md: 240 },
          height: { xs: 160, md: 240 },
          borderRadius: "50%",
          background: "rgba(247, 95, 138, 0.18)",
          filter: "blur(70px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          direction: "ltr",
        }}
      >
        <Navbar
          language={language}
          onLanguageChange={setLanguage}
          t={t}
        />

        <Box
          sx={{
            flex: 1,
            width: "100%",
            maxWidth: 1100,
            mx: "auto",
            direction: "ltr",
          }}
        >
          <HeroSection t={t} textDir={textDir} />
          <FeaturesSection t={t} textDir={textDir} />
          <QuoteSection t={t} textDir={textDir} />
        </Box>

        {/* One continuous wave + branding composition (blush behind both) */}
        <Box
          sx={{
            backgroundColor: "#FBF7F8",
            direction: "ltr",
            mt: { xs: 1, sm: 2 },
          }}
        >
          <WaveDivider />
          <BootcampFooter t={t} />
        </Box>
      </Box>
    </Box>
  );
}

export default Home;
