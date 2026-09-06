import React from "react";
import { Box, Container, Typography, Button } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Link as RouterLink } from "react-router-dom";
import MatchingHeader from "../matching/MatchingHeader";

const pageBackground = `
  radial-gradient(ellipse 80% 55% at 0% 0%, rgba(141, 216, 247, 0.35) 0%, transparent 55%),
  radial-gradient(ellipse 70% 50% at 100% 20%, rgba(255, 182, 201, 0.28) 0%, transparent 50%),
  radial-gradient(ellipse 60% 45% at 85% 100%, rgba(230, 214, 255, 0.3) 0%, transparent 45%),
  linear-gradient(160deg, #EAF7FD 0%, #F9FBFF 42%, #FDF2F6 100%)
`;

/**
 * Shared shell for mentor pages — mirrors MatchingLayout atmosphere.
 */
function MentorLayout({
  title,
  subtitle,
  backTo,
  backLabel = "Back",
  children,
  actions,
}) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: pageBackground,
      }}
    >
      <MatchingHeader />
      <Box
        component="main"
        sx={{
          flex: 1,
          py: { xs: 3, sm: 4 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Container maxWidth="md" disableGutters>
          {(backTo || title) && (
            <Box sx={{ mb: { xs: 2.5, sm: 3 } }}>
              {backTo && (
                <Button
                  component={RouterLink}
                  to={backTo}
                  startIcon={<ArrowBackRoundedIcon />}
                  sx={{
                    mb: 1.5,
                    px: 0,
                    color: "#4A5568",
                    fontWeight: 600,
                    "&:hover": {
                      backgroundColor: "transparent",
                      color: "#F75F8A",
                    },
                  }}
                >
                  {backLabel}
                </Button>
              )}

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "flex-start", sm: "center" },
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Box>
                  {title && (
                    <Typography
                      component="h1"
                      sx={{
                        fontSize: { xs: "1.75rem", sm: "2rem" },
                        fontWeight: 700,
                        color: "#07142D",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {title}
                    </Typography>
                  )}
                  {subtitle && (
                    <Typography
                      sx={{
                        mt: 0.75,
                        color: "#4A5568",
                        fontSize: { xs: "0.95rem", sm: "1rem" },
                        maxWidth: 560,
                        lineHeight: 1.55,
                      }}
                    >
                      {subtitle}
                    </Typography>
                  )}
                </Box>
                {actions}
              </Box>
            </Box>
          )}

          {children}
        </Container>
      </Box>
    </Box>
  );
}

export default MentorLayout;
