import React from "react";
import { Avatar, Box, Button, Chip, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (parts[0] || "?").slice(0, 2).toUpperCase();
}

/**
 * LinkedIn-style mentor directory card.
 */
function MentorCard({ mentor }) {
  const displayName = mentor.username || "Mentor";
  const skills = Array.isArray(mentor.techStack) ? mentor.techStack : [];
  const topics = Array.isArray(mentor.topics) ? mentor.topics : [];

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 4,
        backgroundColor: "rgba(255, 255, 255, 0.82)",
        border: "1px solid rgba(255, 255, 255, 0.9)",
        boxShadow: "0 8px 24px rgba(7, 20, 45, 0.05)",
        backdropFilter: "blur(8px)",
        transition: "transform 200ms ease, box-shadow 200ms ease",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 1.75,
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 12px 28px rgba(7, 20, 45, 0.08)",
        },
      }}
    >
      <Box sx={{ display: "flex", gap: 1.75, alignItems: "center" }}>
        <Avatar
          src={mentor.profileImageUrl || undefined}
          alt=""
          sx={{
            width: 72,
            height: 72,
            flexShrink: 0,
            bgcolor: "rgba(247, 95, 138, 0.15)",
            color: "#F75F8A",
            fontWeight: 700,
            fontSize: "1.15rem",
            border: "3px solid rgba(255, 255, 255, 0.95)",
            boxShadow: "0 4px 14px rgba(7, 20, 45, 0.08)",
          }}
        >
          {getInitials(displayName)}
        </Avatar>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h2"
            sx={{
              fontWeight: 700,
              fontSize: "1.1rem",
              color: "#07142D",
              letterSpacing: "-0.01em",
            }}
          >
            {displayName}
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              mt: 0.35,
            }}
          >
            <WorkOutlineRoundedIcon
              sx={{ fontSize: 16, color: "#8A94A6", flexShrink: 0 }}
            />
            <Typography
              sx={{
                fontSize: "0.875rem",
                color: "#4A5568",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {[mentor.job, mentor.company].filter(Boolean).join(" · ") ||
                "Mentor"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {skills.length > 0 && (
        <Typography
          sx={{
            fontSize: "0.875rem",
            color: "#4A5568",
            lineHeight: 1.5,
          }}
        >
          {skills.slice(0, 4).join(" · ")}
          {skills.length > 4 ? "…" : ""}
        </Typography>
      )}

      {topics.length > 0 && (
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75}>
          {topics.map((topic) => (
            <Chip
              key={topic}
              label={topic}
              size="small"
              sx={{
                borderRadius: "999px",
                backgroundColor: "rgba(141, 216, 247, 0.22)",
                color: "#0B6E99",
                fontWeight: 600,
                fontSize: "0.75rem",
                height: 26,
              }}
            />
          ))}
        </Stack>
      )}

      <Button
        component={RouterLink}
        to={`/mentors/${mentor.id}`}
        variant="contained"
        sx={{
          mt: "auto",
          alignSelf: "stretch",
          px: 2.5,
          py: 1.1,
          borderRadius: 3,
          background: "linear-gradient(135deg, #FF6F91, #F75F8A)",
          boxShadow: "0 8px 20px rgba(247, 95, 138, 0.22)",
          "&:hover": {
            background: "linear-gradient(135deg, #FF7A9A, #E04872)",
            boxShadow: "0 10px 24px rgba(247, 95, 138, 0.3)",
          },
        }}
      >
        View profile
      </Button>
    </Box>
  );
}

export default MentorCard;
