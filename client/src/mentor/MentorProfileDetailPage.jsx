import React, { useEffect, useState } from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import MentorLayout from "./MentorLayout";
import { getMentorById, requestMentorship } from "./mentorService";
import { useAuth } from "../context/AuthContext";

const detailCardSx = {
  p: { xs: 2.25, sm: 3 },
  borderRadius: 4,
  backgroundColor: "rgba(255, 255, 255, 0.86)",
  border: "1px solid rgba(255, 255, 255, 0.95)",
  boxShadow: "0 8px 24px rgba(7, 20, 45, 0.05)",
  backdropFilter: "blur(8px)",
};

const primaryButtonSx = {
  px: 2.75,
  py: 1.2,
  borderRadius: 3,
  background: "linear-gradient(135deg, #FF6F91, #F75F8A)",
  boxShadow: "0 8px 20px rgba(247, 95, 138, 0.22)",
  "&:hover": {
    background: "linear-gradient(135deg, #FF7A9A, #E04872)",
    boxShadow: "0 10px 24px rgba(247, 95, 138, 0.3)",
  },
  "&.Mui-disabled": {
    background: "rgba(247, 95, 138, 0.35)",
    color: "#FFFFFF",
  },
};

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

function MentorProfileDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getMentorById(id);
        if (cancelled) return;
        if (!data) {
          setError("Mentor not found.");
          setMentor(null);
        } else {
          setMentor(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Unable to load this mentor profile.");
          console.error(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleRequest = async () => {
    if (!mentor || requesting) return;
    try {
      setRequesting(true);
      setFeedback(null);
      await requestMentorship(mentor.userId);
      setFeedback({
        severity: "success",
        message: "Request sent! Track it under My Requests.",
      });
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        "Unable to send mentorship request. Please try again.";
      setFeedback({
        severity: "error",
        message: typeof message === "string" ? message : message.message || "Request failed.",
      });
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <MentorLayout backTo="/mentors" backLabel="Mentors">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
            py: 10,
          }}
        >
          <CircularProgress size={36} sx={{ color: "#F75F8A" }} />
          <Typography sx={{ color: "#4A5568" }}>Loading profile…</Typography>
        </Box>
      </MentorLayout>
    );
  }

  if (error || !mentor) {
    return (
      <MentorLayout backTo="/mentors" backLabel="Mentors">
        <Alert severity="error" sx={{ borderRadius: 3, mb: 2 }}>
          {error || "Mentor not found."}
        </Alert>
        <Button component={RouterLink} to="/mentors" variant="outlined">
          Back to mentors
        </Button>
      </MentorLayout>
    );
  }

  const displayName = mentor.username || "Mentor";
  const isOwnProfile = user?.id === mentor.userId;
  const skills = Array.isArray(mentor.techStack) ? mentor.techStack : [];
  const topics = Array.isArray(mentor.topics) ? mentor.topics : [];

  return (
    <MentorLayout
      title={displayName}
      subtitle={[mentor.job, mentor.company].filter(Boolean).join(" at ") || undefined}
      backTo="/mentors"
      backLabel="Mentors"
    >
      <Box sx={detailCardSx}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
          sx={{ mb: 3 }}
        >
          <Avatar
            src={mentor.profileImageUrl || undefined}
            alt=""
            sx={{
              width: 96,
              height: 96,
              bgcolor: "rgba(247, 95, 138, 0.15)",
              color: "#F75F8A",
              fontWeight: 700,
              fontSize: "1.5rem",
              border: "3px solid rgba(255, 255, 255, 0.95)",
              boxShadow: "0 6px 18px rgba(7, 20, 45, 0.1)",
            }}
          >
            {getInitials(displayName)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "1.35rem",
                color: "#07142D",
                letterSpacing: "-0.01em",
              }}
            >
              {displayName}
            </Typography>
            <Typography sx={{ color: "#4A5568", mt: 0.35 }}>
              {[mentor.job, mentor.company].filter(Boolean).join(" · ")}
            </Typography>
            {mentor.yearsExperience != null && (
              <Typography sx={{ color: "#6B7280", fontSize: "0.9rem", mt: 0.5 }}>
                {mentor.yearsExperience}{" "}
                {mentor.yearsExperience === 1 ? "year" : "years"} experience
              </Typography>
            )}
          </Box>
        </Stack>

        {feedback && (
          <Alert severity={feedback.severity} sx={{ mb: 2.5, borderRadius: 3 }}>
            {feedback.message}
            {feedback.severity === "success" && (
              <Button
                size="small"
                onClick={() => navigate("/my-requests")}
                sx={{ ml: 1, color: "#2F855A", fontWeight: 700 }}
              >
                View requests
              </Button>
            )}
          </Alert>
        )}

        {topics.length > 0 && (
          <Box sx={{ mb: 2.5 }}>
            <Typography
              sx={{
                fontWeight: 600,
                color: "#07142D",
                mb: 1,
                fontSize: "0.95rem",
              }}
            >
              Mentoring topics
            </Typography>
            <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75}>
              {topics.map((topic) => (
                <Chip
                  key={topic}
                  label={topic}
                  sx={{
                    borderRadius: "999px",
                    backgroundColor: "rgba(141, 216, 247, 0.22)",
                    color: "#0B6E99",
                    fontWeight: 600,
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {skills.length > 0 && (
          <Box sx={{ mb: 2.5 }}>
            <Typography
              sx={{
                fontWeight: 600,
                color: "#07142D",
                mb: 1,
                fontSize: "0.95rem",
              }}
            >
              Tech stack
            </Typography>
            <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75}>
              {skills.map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  sx={{
                    borderRadius: "999px",
                    backgroundColor: "rgba(247, 95, 138, 0.1)",
                    color: "#D93F68",
                    fontWeight: 600,
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {mentor.background && (
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontWeight: 600,
                color: "#07142D",
                mb: 1,
                fontSize: "0.95rem",
              }}
            >
              Background
            </Typography>
            <Typography
              sx={{ color: "#4A5568", lineHeight: 1.65, whiteSpace: "pre-wrap" }}
            >
              {mentor.background}
            </Typography>
          </Box>
        )}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.25}
          sx={{ color: "#6B7280", fontSize: "0.9rem", mb: 3 }}
        >
          {mentor.sessionDuration != null && (
            <Typography sx={{ color: "#6B7280", fontSize: "0.9rem" }}>
              Session length: {mentor.sessionDuration} min
            </Typography>
          )}
          {mentor.maxSessions != null && (
            <Typography sx={{ color: "#6B7280", fontSize: "0.9rem" }}>
              Max sessions: {mentor.maxSessions}
            </Typography>
          )}
        </Stack>

        {!isOwnProfile && (
          <Button
            variant="contained"
            disabled={requesting}
            onClick={handleRequest}
            sx={primaryButtonSx}
          >
            {requesting ? "Sending request…" : "Request mentorship"}
          </Button>
        )}

        {isOwnProfile && (
          <Button
            component={RouterLink}
            to="/become-mentor"
            variant="outlined"
            sx={{
              px: 2.5,
              py: 1.15,
              borderRadius: 3,
              borderWidth: 1.5,
              borderColor: "#F75F8A",
              color: "#F75F8A",
              "&:hover": {
                borderWidth: 1.5,
                borderColor: "#E04872",
                backgroundColor: "rgba(247, 95, 138, 0.06)",
              },
            }}
          >
            Edit my mentor profile
          </Button>
        )}
      </Box>
    </MentorLayout>
  );
}

export default MentorProfileDetailPage;
