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

function ChipList({ items }) {
  if (!items || items.length === 0) {
    return <Typography sx={{ color: "#6B7280" }}>—</Typography>;
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
    <Box>
      <Button
        component={RouterLink}
        to="/admin/users"
        startIcon={<ArrowBackRoundedIcon />}
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
        Back to users
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
        User details
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
          <Typography sx={{ color: "#4A5568" }}>Loading user…</Typography>
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          Could not load this user. Please try again.
        </Alert>
      )}

      {!loading && !error && user === null && (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          User not found.
        </Alert>
      )}

      {!loading && !error && user && (
        <Stack spacing={2.5}>
          <Box component="section" sx={sectionSx}>
            <Typography
              component="h2"
              sx={{ fontWeight: 700, color: "#07142D", mb: 2 }}
            >
              Account
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
              <Field label="ID">{user.id}</Field>
              <Field label="Username">{user.username}</Field>
              <Field label="Email">{user.email}</Field>
              <Field label="Admin">{user.isAdmin ? "Yes" : "No"}</Field>
              <Field label="Registered">
                {formatAdminDateTime(user.createdAt)}
              </Field>
            </Box>
          </Box>

          <Box component="section" sx={sectionSx}>
            <Typography
              component="h2"
              sx={{ fontWeight: 700, color: "#07142D", mb: 1 }}
            >
              Mentoring matchings
            </Typography>
            <Typography sx={{ color: "#6B7280", fontSize: "0.9rem", mb: 2 }}>
              These counts currently represent matching records, not confirmed
              completed mentoring sessions.
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
              <Field label="As mentor">{user.matchingCountAsMentor}</Field>
              <Field label="As mentee">{user.matchingCountAsMentee}</Field>
            </Box>
          </Box>

          <Box component="section" sx={sectionSx}>
            <Typography
              component="h2"
              sx={{ fontWeight: 700, color: "#07142D", mb: 2 }}
            >
              Mentor profile
            </Typography>
            {!mentorProfile ? (
              <Typography sx={{ color: "#6B7280" }}>No mentor profile</Typography>
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
                <Field label="Job">{mentorProfile.job || "—"}</Field>
                <Field label="Company">{mentorProfile.company || "—"}</Field>
                <Field label="Years experience">
                  {mentorProfile.yearsExperience ?? "—"}
                </Field>
                <Field label="Active">
                  {mentorProfile.isActive ? "Yes" : "No"}
                </Field>
                <Field label="Max sessions">
                  {mentorProfile.maxSessions ?? "—"}
                </Field>
                <Field label="Session duration (min)">
                  {mentorProfile.sessionDuration ?? "—"}
                </Field>
                <Box sx={{ gridColumn: "1 / -1" }}>
                  <Field label="Background">
                    {mentorProfile.background || "—"}
                  </Field>
                </Box>
                <Box sx={{ gridColumn: "1 / -1" }}>
                  <Field label="Topics">
                    <ChipList items={mentorProfile.topics} />
                  </Field>
                </Box>
                <Box sx={{ gridColumn: "1 / -1" }}>
                  <Field label="Tech stack">
                    <ChipList items={mentorProfile.techStack} />
                  </Field>
                </Box>
                <Field label="Profile updated">
                  {formatAdminDate(mentorProfile.updatedAt)}
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
