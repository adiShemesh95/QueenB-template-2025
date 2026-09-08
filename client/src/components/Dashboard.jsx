import React from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AppNavbar from "./AppNavbar";
import BootcampFooter from "./BootcampFooter";
import { useAuth } from "../context/AuthContext";
import { useMatchingLanguage } from "../matching/MatchingLanguageContext";
import dashboardTranslations from "./dashboardTranslations";

const pageBackground = `
  radial-gradient(ellipse 80% 55% at 0% 0%, rgba(141, 216, 247, 0.35) 0%, transparent 55%),
  radial-gradient(ellipse 70% 50% at 100% 20%, rgba(255, 182, 201, 0.28) 0%, transparent 50%),
  radial-gradient(ellipse 60% 45% at 85% 100%, rgba(230, 214, 255, 0.3) 0%, transparent 45%),
  linear-gradient(160deg, #EAF7FD 0%, #F9FBFF 42%, #FDF2F6 100%)
`;

const glassCardSx = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  textAlign: "left",
  p: { xs: 3, sm: 3.5 },
  minHeight: { xs: 220, sm: 260 },
  borderRadius: 4,
  backgroundColor: "rgba(255, 255, 255, 0.82)",
  border: "1px solid rgba(255, 255, 255, 0.9)",
  boxShadow: "0 8px 24px rgba(7, 20, 45, 0.05)",
  backdropFilter: "blur(8px)",
  textDecoration: "none",
  color: "inherit",
  transition: "transform 200ms ease, box-shadow 200ms ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 16px 36px rgba(7, 20, 45, 0.1)",
  },
  "&:focus-visible": {
    outline: "2px solid #F75F8A",
    outlineOffset: 3,
  },
};

function ActionCard({ to, icon, title, description, cta, textAlign, dir }) {
  return (
    <Box
      component={RouterLink}
      to={to}
      sx={{
        ...glassCardSx,
        alignItems: textAlign === "right" ? "flex-end" : "flex-start",
        textAlign: textAlign || "left",
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2,
          background:
            "linear-gradient(135deg, rgba(141, 216, 247, 0.35), rgba(247, 95, 138, 0.2))",
          color: "#F75F8A",
        }}
      >
        {icon}
      </Box>

      <Typography
        component="h2"
        sx={{
          fontWeight: 700,
          fontSize: { xs: "1.35rem", sm: "1.5rem" },
          color: "#07142D",
          letterSpacing: "-0.02em",
          mb: 1,
        }}
      >
        {title}
      </Typography>

      <Typography
        sx={{
          color: "#4A5568",
          fontSize: "0.98rem",
          lineHeight: 1.6,
          mb: 2.5,
          flex: 1,
        }}
      >
        {description}
      </Typography>

      <Button
        component="span"
        endIcon={
          <ArrowForwardRoundedIcon
            sx={{
              // Forward/CTA: point with reading flow (→ LTR, ← RTL)
              transform: dir === "rtl" ? "scaleX(-1)" : "none",
            }}
          />
        }
        sx={{
          px: 0,
          color: "#F75F8A",
          fontWeight: 700,
          "&:hover": { backgroundColor: "transparent" },
        }}
      >
        {cta}
      </Button>
    </Box>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const { language, setLanguage, dir } = useMatchingLanguage();
  const t = dashboardTranslations[language] || dashboardTranslations.en;
  const textAlign = dir === "rtl" ? "right" : "left";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: pageBackground,
      }}
    >
      <AppNavbar
        language={language}
        onLanguageChange={setLanguage}
        languageAria={t.languageAria}
      />

      <Box
        component="main"
        dir={dir}
        lang={language}
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          py: { xs: 4, sm: 6 },
          px: { xs: 2, sm: 3 },
          direction: dir,
        }}
      >
        <Container maxWidth="md" disableGutters>
          <Box sx={{ textAlign: "center", mb: { xs: 3.5, sm: 4.5 } }}>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: "1.85rem", sm: "2.25rem" },
                fontWeight: 700,
                color: "#07142D",
                letterSpacing: "-0.02em",
              }}
            >
              {user?.username ? t.welcome(user.username) : t.welcomeGuest}
            </Typography>
            <Typography
              sx={{
                mt: 1,
                color: "#4A5568",
                fontSize: { xs: "1rem", sm: "1.05rem" },
                maxWidth: 480,
                mx: "auto",
                lineHeight: 1.55,
              }}
            >
              {t.subtitle}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2.5,
            }}
          >
            <ActionCard
              to="/mentors"
              icon={<GroupsRoundedIcon />}
              title={t.browseTitle}
              description={t.browseDescription}
              cta={t.browseCta}
              textAlign={textAlign}
              dir={dir}
            />
            <ActionCard
              to="/become-mentor"
              icon={<VolunteerActivismRoundedIcon />}
              title={t.becomeTitle}
              description={t.becomeDescription}
              cta={t.becomeCta}
              textAlign={textAlign}
              dir={dir}
            />
          </Box>
        </Container>
      </Box>

      <BootcampFooter />
    </Box>
  );
}

export default Dashboard;
