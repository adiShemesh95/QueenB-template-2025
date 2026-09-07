import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

const glassCardSx = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  textAlign: "left",
  p: { xs: 3, sm: 3.5 },
  minHeight: { xs: 200, sm: 220 },
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

function NavCard({ to, icon, title, description, cta }) {
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
          fontSize: { xs: "1.25rem", sm: "1.4rem" },
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

/**
 * Lightweight Admin overview — navigation only, no invented analytics.
 * Dashboard metrics would require APIs that do not exist yet.
 */
function AdminDashboardPage() {
  return (
    <Box>
      <Typography
        component="h1"
        sx={{
          fontSize: { xs: "1.75rem", sm: "2rem" },
          fontWeight: 700,
          color: "#07142D",
          letterSpacing: "-0.02em",
          mb: 0.75,
        }}
      >
        Admin overview
      </Typography>
      <Typography
        sx={{
          color: "#4A5568",
          mb: 3,
          maxWidth: 560,
          lineHeight: 1.55,
        }}
      >
        Review registered users and matching records. Calendar and alerts are
        not part of this stage.
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2.5,
        }}
      >
        <NavCard
          to="/admin/users"
          icon={<PeopleAltRoundedIcon />}
          title="Users"
          description="View registered users and provisional mentoring matching counts."
          cta="View users"
        />
        <NavCard
          to="/admin/matchings"
          icon={<HubRoundedIcon />}
          title="Matchings"
          description="View the matching report and open individual matching details."
          cta="View matchings"
        />
      </Box>
    </Box>
  );
}

export default AdminDashboardPage;
