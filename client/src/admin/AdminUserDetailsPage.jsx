import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { getAdminUserById } from "./adminService";
import { formatAdminDate, formatAdminDateTime } from "./adminFormat";
import { useAdminLanguage } from "./translations";

const sectionSx = {
  p: { xs: 2.5, sm: 3 },
  borderRadius: 3,
  backgroundColor: "rgba(255, 255, 255, 0.88)",
  border: "1px solid rgba(255, 255, 255, 0.95)",
  boxShadow: "0 8px 24px rgba(7, 20, 45, 0.05)",
};

function Field({ label, children }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography
        component="dt"
        sx={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "#6B7280",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          mb: 0.35,
        }}
      >
        {label}
      </Typography>
      <Typography component="dd" sx={{ m: 0, color: "#07142D", fontWeight: 500 }}>
        {children}
      </Typography>
    </Box>
  );
}

function ChipList({ items, emptyLabel }) {
  if (!items || items.length === 0) {
    return <Typography sx={{ color: "#6B7280" }}>{emptyLabel}</Typography>;
  }
  return (
    <Stack direction="row" flexWrap="wrap" gap={0.75}>
      {items.map((item) => (
        <Chip
          key={item}
          label={item}
          size="small"
          sx={{
            fontWeight: 600,
            backgroundColor: "rgba(141, 216, 247, 0.2)",
            color: "#0B6E99",
          }}
        />
      ))}
    </Stack>
  );
}

/**
 * Admin user detail — exact GET /api/admin/users/:id shape.
 * Counts are matching-row totals, not completed meetings (lifecycle pending).
 */
function AdminUserDetailsPage() {
  const { id } = useParams();
  const { language, dir, t } = useAdminLanguage();
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(false);
        const data = await getAdminUserById(id);
        if (!cancelled) setUser(data);
      } catch (err) {
        if (!cancelled) {
          setError(true);
          setUser(undefined);
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

  const mentorProfile = user?.mentorProfile;

  return (
    <Box dir={dir} lang={language}>
      <Button
        component={RouterLink}
        to="/admin/users"
        startIcon={
          <ArrowBackRoundedIcon
            sx={{
              // Back action: point opposite reading flow (← LTR, → RTL)
              transform: dir === "rtl" ? "scaleX(-1)" : "none",
            }}
          />
        }
        sx={{
          mb: 2,
          px: 0,
          color: "#4A5568",
          fontWeight: 600,
          "&:hover": {
            backgroundColor: "transparent",
            color: "#F75F8A",
          },
        }}
      >
        {t.backToUsers}
      </Button>

      <Typography
        component="h1"
        sx={{
          fontSize: { xs: "1.75rem", sm: "2rem" },
          fontWeight: 700,
          color: "#07142D",
          letterSpacing: "-0.02em",
          mb: 3,
        }}
      >
        {t.userDetailsTitle}
      </Typography>

      {loading && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
            py: 8,
          }}
        >
          <CircularProgress size={36} sx={{ color: "#F75F8A" }} />
          <Typography sx={{ color: "#4A5568" }}>{t.loadingUser}</Typography>
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {t.loadUserError}
        </Alert>
      )}

      {!loading && !error && user === null && (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          {t.userNotFound}
        </Alert>
      )}

      {!loading && !error && user && (
        <Stack spacing={2.5}>
          <Box component="section" sx={sectionSx}>
            <Typography
              component="h2"
              sx={{ fontWeight: 700, color: "#07142D", mb: 2 }}
            >
              {t.sectionAccount}
            </Typography>
            <Box
              component="dl"
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1,
                m: 0,
              }}
            >
              <Field label={t.fieldId}>{user.id}</Field>
              <Field label={t.fieldUsername}>{user.username}</Field>
              <Field label={t.fieldEmail}>{user.email}</Field>
              <Field label={t.fieldAdmin}>{user.isAdmin ? t.yes : t.no}</Field>
              <Field label={t.fieldRegistered}>
                {formatAdminDateTime(user.createdAt, language)}
              </Field>
            </Box>
          </Box>

          <Box component="section" sx={sectionSx}>
            <Typography
              component="h2"
              sx={{ fontWeight: 700, color: "#07142D", mb: 1 }}
            >
              {t.sectionMentoringMatchings}
            </Typography>
            <Typography sx={{ color: "#6B7280", fontSize: "0.9rem", mb: 2 }}>
              {t.mentoringMatchingsHint}
            </Typography>
            <Box
              component="dl"
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1,
                m: 0,
              }}
            >
              <Field label={t.fieldAsMentor}>{user.matchingCountAsMentor}</Field>
              <Field label={t.fieldAsMentee}>{user.matchingCountAsMentee}</Field>
            </Box>
          </Box>

          <Box component="section" sx={sectionSx}>
            <Typography
              component="h2"
              sx={{ fontWeight: 700, color: "#07142D", mb: 2 }}
            >
              {t.sectionMentorProfile}
            </Typography>
            {!mentorProfile ? (
              <Typography sx={{ color: "#6B7280" }}>{t.noMentorProfile}</Typography>
            ) : (
              <Box
                component="dl"
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1,
                  m: 0,
                }}
              >
                <Field label={t.fieldJob}>{mentorProfile.job || t.emDash}</Field>
                <Field label={t.fieldCompany}>
                  {mentorProfile.company || t.emDash}
                </Field>
                <Field label={t.fieldYearsExperience}>
                  {mentorProfile.yearsExperience ?? t.emDash}
                </Field>
                <Field label={t.fieldActive}>
                  {mentorProfile.isActive ? t.yes : t.no}
                </Field>
                <Field label={t.fieldMaxSessions}>
                  {mentorProfile.maxSessions ?? t.emDash}
                </Field>
                <Field label={t.fieldSessionDuration}>
                  {mentorProfile.sessionDuration ?? t.emDash}
                </Field>
                <Box sx={{ gridColumn: "1 / -1" }}>
                  <Field label={t.fieldBackground}>
                    {mentorProfile.background || t.emDash}
                  </Field>
                </Box>
                <Box sx={{ gridColumn: "1 / -1" }}>
                  <Field label={t.fieldTopics}>
                    <ChipList items={mentorProfile.topics} emptyLabel={t.emDash} />
                  </Field>
                </Box>
                <Box sx={{ gridColumn: "1 / -1" }}>
                  <Field label={t.fieldTechStack}>
                    <ChipList
                      items={mentorProfile.techStack}
                      emptyLabel={t.emDash}
                    />
                  </Field>
                </Box>
                <Field label={t.fieldProfileUpdated}>
                  {formatAdminDate(mentorProfile.updatedAt, language)}
                </Field>
              </Box>
            )}
          </Box>
        </Stack>
      )}
    </Box>
  );
}

export default AdminUserDetailsPage;
