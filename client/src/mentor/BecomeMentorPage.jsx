import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import MentorLayout from "./MentorLayout";
import {
  MENTOR_TOPICS,
  getMyMentorProfile,
  saveMentorProfile,
} from "./mentorService";

const formCardSx = {
  p: { xs: 2.5, sm: 3.5 },
  borderRadius: 4,
  backgroundColor: "rgba(255, 255, 255, 0.85)",
  boxShadow: "0 12px 40px rgba(7, 20, 45, 0.08)",
  border: "1px solid rgba(247, 95, 138, 0.12)",
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

function emptyFieldErrors() {
  return {
    job: "",
    company: "",
    yearsExperience: "",
    topics: "",
    techStack: "",
    maxSessions: "",
    sessionDuration: "",
    profileImageUrl: "",
    background: "",
  };
}

function BecomeMentorPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState(emptyFieldErrors());
  const [isEdit, setIsEdit] = useState(false);

  const [job, setJob] = useState("");
  const [company, setCompany] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [techStack, setTechStack] = useState("");
  const [background, setBackground] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [maxSessions, setMaxSessions] = useState("5");
  const [sessionDuration, setSessionDuration] = useState("60");
  const [topics, setTopics] = useState([]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const profile = await getMyMentorProfile();
        if (cancelled || !profile) return;

        setIsEdit(true);
        setJob(profile.job || "");
        setCompany(profile.company || "");
        setYearsExperience(
          profile.yearsExperience != null ? String(profile.yearsExperience) : ""
        );
        setTechStack(
          Array.isArray(profile.techStack) ? profile.techStack.join(", ") : ""
        );
        setBackground(profile.background || "");
        setProfileImageUrl(profile.profileImageUrl || "");
        setMaxSessions(
          profile.maxSessions != null ? String(profile.maxSessions) : "5"
        );
        setSessionDuration(
          profile.sessionDuration != null
            ? String(profile.sessionDuration)
            : "60"
        );
        setTopics(Array.isArray(profile.topics) ? profile.topics : []);
        setIsActive(profile.isActive !== false);
      } catch (err) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleTopic = (topic) => {
    setTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setGeneralError("");
    setSuccessMessage("");
    const errors = emptyFieldErrors();

    if (!job.trim()) errors.job = "Job title is required.";
    if (!company.trim()) errors.company = "Company is required.";
    if (topics.length === 0) errors.topics = "Select at least one topic.";

    if (yearsExperience !== "" && !Number.isInteger(Number(yearsExperience))) {
      errors.yearsExperience = "Enter a whole number.";
    }
    if (maxSessions !== "" && !Number.isInteger(Number(maxSessions))) {
      errors.maxSessions = "Enter a whole number.";
    }
    if (sessionDuration !== "" && !Number.isInteger(Number(sessionDuration))) {
      errors.sessionDuration = "Enter a whole number.";
    }

    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    setSubmitting(true);
    try {
      const saved = await saveMentorProfile({
        job: job.trim(),
        company: company.trim(),
        yearsExperience:
          yearsExperience === "" ? null : Number(yearsExperience),
        techStack: techStack
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        background: background.trim() || null,
        profileImageUrl: profileImageUrl.trim() || null,
        maxSessions: maxSessions === "" ? 5 : Number(maxSessions),
        sessionDuration:
          sessionDuration === "" ? 60 : Number(sessionDuration),
        topics,
        isActive,
      });

      setIsEdit(true);
      setSuccessMessage(
        isEdit
          ? "Your mentor profile was updated."
          : "Your mentor profile is live!"
      );

      if (saved?.id) {
        setTimeout(() => navigate(`/mentors/${saved.id}`), 700);
      }
    } catch (err) {
      const apiError = err?.response?.data?.error;
      const details = Array.isArray(apiError?.details) ? apiError.details : [];

      if (apiError?.code === "VALIDATION_ERROR" && details.length > 0) {
        const mapped = emptyFieldErrors();
        details.forEach((detail) => {
          if (detail?.field && detail.field in mapped && detail.message) {
            mapped[detail.field] = detail.message;
          }
        });
        setFieldErrors(mapped);
      } else {
        setGeneralError(
          apiError?.message ||
            "Unable to save your mentor profile. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MentorLayout
        title="Become a mentor"
        backTo="/mentors"
        backLabel="Mentors"
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 10,
          }}
        >
          <CircularProgress size={36} sx={{ color: "#F75F8A" }} />
        </Box>
      </MentorLayout>
    );
  }

  return (
    <MentorLayout
      title={isEdit ? "Edit mentor profile" : "Become a mentor"}
      subtitle="Share your experience so mentees can find the right match."
      backTo="/mentors"
      backLabel="Mentors"
    >
      <Box component="form" onSubmit={handleSubmit} noValidate sx={formCardSx}>
        {generalError ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {generalError}
          </Alert>
        ) : null}
        {successMessage ? (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            {successMessage}
          </Alert>
        ) : null}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Job title"
            value={job}
            onChange={(e) => setJob(e.target.value)}
            error={Boolean(fieldErrors.job)}
            helperText={fieldErrors.job || " "}
            disabled={submitting}
            fullWidth
            required
          />
          <TextField
            label="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            error={Boolean(fieldErrors.company)}
            helperText={fieldErrors.company || " "}
            disabled={submitting}
            fullWidth
            required
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Years of experience"
            type="number"
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            error={Boolean(fieldErrors.yearsExperience)}
            helperText={fieldErrors.yearsExperience || " "}
            disabled={submitting}
            fullWidth
            inputProps={{ min: 0 }}
          />
          <TextField
            label="Session duration (minutes)"
            type="number"
            value={sessionDuration}
            onChange={(e) => setSessionDuration(e.target.value)}
            error={Boolean(fieldErrors.sessionDuration)}
            helperText={fieldErrors.sessionDuration || " "}
            disabled={submitting}
            fullWidth
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Max sessions"
            type="number"
            value={maxSessions}
            onChange={(e) => setMaxSessions(e.target.value)}
            error={Boolean(fieldErrors.maxSessions)}
            helperText={fieldErrors.maxSessions || " "}
            disabled={submitting}
            fullWidth
            inputProps={{ min: 1 }}
          />
        </Stack>

        <TextField
          label="Tech stack"
          value={techStack}
          onChange={(e) => setTechStack(e.target.value)}
          error={Boolean(fieldErrors.techStack)}
          helperText={
            fieldErrors.techStack || "Comma-separated skills (e.g. React, Node.js)"
          }
          disabled={submitting}
          fullWidth
        />

        <TextField
          label="Profile picture URL"
          value={profileImageUrl}
          onChange={(e) => setProfileImageUrl(e.target.value)}
          error={Boolean(fieldErrors.profileImageUrl)}
          helperText={
            fieldErrors.profileImageUrl ||
            "Paste a LinkedIn-style photo URL (optional)"
          }
          disabled={submitting}
          fullWidth
        />

        <TextField
          label="Background"
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          error={Boolean(fieldErrors.background)}
          helperText={fieldErrors.background || " "}
          disabled={submitting}
          fullWidth
          multiline
          minRows={3}
        />

        <Box>
          <Typography
            sx={{ fontWeight: 600, color: "#07142D", mb: 1, fontSize: "0.95rem" }}
          >
            Mentoring topics
          </Typography>
          <FormGroup>
            <Stack direction="row" flexWrap="wrap" useFlexGap>
              {MENTOR_TOPICS.map((topic) => (
                <FormControlLabel
                  key={topic}
                  control={
                    <Checkbox
                      checked={topics.includes(topic)}
                      onChange={() => toggleTopic(topic)}
                      disabled={submitting}
                      sx={{
                        color: "#C4CDD8",
                        "&.Mui-checked": { color: "#F75F8A" },
                      }}
                    />
                  }
                  label={topic}
                  sx={{ mr: 2, color: "#4A5568" }}
                />
              ))}
            </Stack>
          </FormGroup>
          <FormHelperText error={Boolean(fieldErrors.topics)}>
            {fieldErrors.topics || " "}
          </FormHelperText>
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={submitting}
              sx={{
                color: "#C4CDD8",
                "&.Mui-checked": { color: "#F75F8A" },
              }}
            />
          }
          label="Show my profile in the mentors directory"
          sx={{ color: "#4A5568" }}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={submitting}
          sx={{
            mt: 0.5,
            py: 1.35,
            borderRadius: 3,
            background: "linear-gradient(135deg, #FF6F91, #F75F8A)",
            boxShadow: "0 8px 20px rgba(247, 95, 138, 0.25)",
            "&:hover": {
              background: "linear-gradient(135deg, #FF7A9A, #F75F8A)",
            },
          }}
        >
          {submitting ? (
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={18} color="inherit" />
              Saving…
            </Box>
          ) : isEdit ? (
            "Save changes"
          ) : (
            "Publish mentor profile"
          )}
        </Button>
      </Box>
    </MentorLayout>
  );
}

export default BecomeMentorPage;
