import React from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AppNavbar from "./AppNavbar";
import { useAuth } from "../context/AuthContext";

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

function ActionCard({ to, icon, title, description, cta }) {
  return (
    <Box component={RouterLink} to={to} sx={glassCardSx}>
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
        endIcon={<ArrowForwardRoundedIcon />}
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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: pageBackground,
      }}
    >
      <AppNavbar />

      <Box
        component="main"
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          py: { xs: 4, sm: 6 },
          px: { xs: 2, sm: 3 },
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
              Welcome{user?.username ? `, ${user.username}` : ""}
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
              Choose how you want to start — find a mentor, or share your
              experience with mentees.
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
              title="Browse Mentors"
              description="Explore mentor profiles, skills, and topics — then request a session that fits your goals."
              cta="Find a mentor"
            />
            <ActionCard
              to="/become-mentor"
              icon={<VolunteerActivismRoundedIcon />}
              title="Become a Mentor"
              description="Create your mentor profile, set your topics, and start receiving mentee requests."
              cta="Create profile"
            />
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

export default Dashboard;
