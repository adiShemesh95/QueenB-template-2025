import React from "react";
import { AppBar, Avatar, Box, Toolbar, Typography } from "@mui/material";
import LanguageSelector from "../components/home/LanguageSelector";
import { useMatchingLanguage } from "./MatchingLanguageContext";
import { useAuth } from "../context/AuthContext";

/**
 * Temporary matching toolbar.
 * Isolated here so it can later be replaced by the shared app header
 * without rewriting matching pages.
 */
function getUsernameInitials(username) {
  const name = String(username || "").trim();
  if (!name) return "?";

  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

function MatchingHeader() {
  const { language, setLanguage, t } = useMatchingLanguage();
  const { user } = useAuth();
  const username = user?.username || "";
  const initials = getUsernameInitials(username);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      // Toolbar chrome stays LTR in both languages (same as landing Navbar).
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
          gap: 2,
          direction: "ltr",
        }}
      >
        <Typography
          component="div"
          sx={{
            fontWeight: 700,
            fontSize: { xs: "1.05rem", sm: "1.15rem" },
            color: "#07142D",
            letterSpacing: "-0.02em",
          }}
        >
          {t.appName}
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 1, sm: 1.5 },
            direction: "ltr",
          }}
        >
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
            <Box
              sx={{
                display: { xs: "none", sm: "block" },
                lineHeight: 1.2,
                textAlign: "left",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#07142D",
                }}
              >
                {username}
              </Typography>
            </Box>
          </Box>

          <LanguageSelector
            language={language}
            onLanguageChange={setLanguage}
            ariaLabel={t.languageAria}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default MatchingHeader;
