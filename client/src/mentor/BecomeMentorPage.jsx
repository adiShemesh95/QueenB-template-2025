import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Snackbar,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import MentorLayout from "./MentorLayout";
import {
  MENTOR_TOPICS,
  getMyMentorProfile,
  saveMentorProfile,
} from "./mentorService";
import { useMentorLanguage, getMentorTopicLabel } from "./translations";
import appTheme from "../theme";

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
  const { t, dir } = useMentorLanguage();
  const formTheme = useMemo(
    () => createTheme(appTheme, { direction: dir }),
    [dir]
  );
  const fieldSx =
    dir === "rtl"
      ? {
          "& .MuiInputLabel-root": {
            textAlign: "right",
          },
          "& .MuiFormHelperText-root": {
            textAlign: "right",
          },
        }
      : undefined;
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
      prev.includes(topic) ? prev.filter((item) => item !== topic) : [...prev, topic]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setGeneralError("");
    setSuccessMessage("");
    const errors = emptyFieldErrors();

    if (!job.trim()) errors.job = t.jobRequired;
    if (!company.trim()) errors.company = t.companyRequired;
    if (topics.length === 0) errors.topics = t.topicsRequired;

    if (yearsExperience !== "" && !Number.isInteger(Number(yearsExperience))) {
      errors.yearsExperience = t.wholeNumber;
    }
    if (maxSessions !== "" && !Number.isInteger(Number(maxSessions))) {
      errors.maxSessions = t.wholeNumber;
    }
    if (sessionDuration !== "" && !Number.isInteger(Number(sessionDuration))) {
      errors.sessionDuration = t.wholeNumber;
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
      setSuccessMessage(isEdit ? t.profileUpdated : t.profileLive);

      if (saved?.id && isActive) {
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
        setGeneralError(apiError?.message || t.saveProfileError);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MentorLayout
        title={t.becomeMentorTitle}
        backTo="/mentors"
        backLabel={t.mentors}
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
      title={isEdit ? t.editMentorTitle : t.becomeMentorTitle}
      subtitle={t.becomeMentorSubtitle}
      backTo="/mentors"
      backLabel={t.mentors}
    >
      <ThemeProvider theme={formTheme}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          dir={dir}
          sx={formCardSx}
        >
        {generalError ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {generalError}
          </Alert>
        ) : null}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label={t.jobTitle}
            value={job}
            onChange={(e) => setJob(e.target.value)}
            error={Boolean(fieldErrors.job)}
            helperText={fieldErrors.job || " "}
            disabled={submitting}
            fullWidth
            required
            sx={fieldSx}
          />
          <TextField
            label={t.company}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            error={Boolean(fieldErrors.company)}
            helperText={fieldErrors.company || " "}
            disabled={submitting}
            fullWidth
            required
            sx={fieldSx}
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label={t.yearsOfExperience}
            type="number"
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            error={Boolean(fieldErrors.yearsExperience)}
            helperText={fieldErrors.yearsExperience || " "}
            disabled={submitting}
            fullWidth
            inputProps={{ min: 0 }}
            sx={fieldSx}
          />
          <TextField
            label={t.sessionDurationMinutes}
            type="number"
            value={sessionDuration}
            onChange={(e) => setSessionDuration(e.target.value)}
            error={Boolean(fieldErrors.sessionDuration)}
            helperText={fieldErrors.sessionDuration || " "}
            disabled={submitting}
            fullWidth
            inputProps={{ min: 1 }}
            sx={fieldSx}
          />
          <TextField
            label={t.maxSessions}
            type="number"
            value={maxSessions}
            onChange={(e) => setMaxSessions(e.target.value)}
            error={Boolean(fieldErrors.maxSessions)}
            helperText={fieldErrors.maxSessions || " "}
            disabled={submitting}
            fullWidth
            inputProps={{ min: 1 }}
            sx={fieldSx}
          />
        </Stack>

        <TextField
          label={t.techStackField}
          value={techStack}
          onChange={(e) => setTechStack(e.target.value)}
          error={Boolean(fieldErrors.techStack)}
          helperText={fieldErrors.techStack || t.techStackHelper}
          disabled={submitting}
          fullWidth
          sx={fieldSx}
        />

        <TextField
          label={t.profilePictureUrl}
          value={profileImageUrl}
          onChange={(e) => setProfileImageUrl(e.target.value)}
          error={Boolean(fieldErrors.profileImageUrl)}
          helperText={fieldErrors.profileImageUrl || t.profilePictureHelper}
          disabled={submitting}
          fullWidth
          sx={fieldSx}
        />

        <TextField
          label={t.backgroundField}
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          error={Boolean(fieldErrors.background)}
          helperText={fieldErrors.background || " "}
          disabled={submitting}
          fullWidth
          multiline
          minRows={3}
          sx={fieldSx}
        />

        <Box>
          <Typography
            sx={{
              fontWeight: 600,
              color: "#07142D",
              mb: 1,
              fontSize: "0.95rem",
              textAlign: dir === "rtl" ? "right" : "left",
            }}
          >
            {t.mentoringTopics}
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
                  label={getMentorTopicLabel(topic, t)}
                  sx={{ mr: 2, color: "#4A5568" }}
                />
              ))}
            </Stack>
          </FormGroup>
          <FormHelperText
            error={Boolean(fieldErrors.topics)}
            sx={dir === "rtl" ? { textAlign: "right" } : undefined}
          >
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
          label={t.showInDirectory}
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
              {t.saving}
            </Box>
          ) : isEdit ? (
            t.saveChanges
          ) : (
            t.publishProfile
          )}
        </Button>
        </Box>

        <Snackbar
          open={Boolean(successMessage)}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage("")}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity="success"
            variant="filled"
            onClose={() => setSuccessMessage("")}
            sx={{ borderRadius: 2, width: "100%" }}
          >
            {successMessage}
          </Alert>
        </Snackbar>
      </ThemeProvider>
    </MentorLayout>
  );
}

export default BecomeMentorPage;
