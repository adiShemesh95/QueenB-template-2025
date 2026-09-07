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
import { getAdminMatchingById } from "./adminService";
import AdminStatusChip from "./AdminStatusChip";
import {
  formatAdminDateTime,
  formatAdminTimeRange,
} from "./adminFormat";

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
 * Admin matching detail — GET /api/admin/matchings/:id.
 *
 * selectedSlot is the chosen meeting time (from matching.selected_slot_id).
 * slots[] is the full set of times proposed during scheduling.
 * Do not derive the meeting time from slots[].
 *
 * feedback is currently always null from Stage 4 — show "unavailable"
 * instead of inventing feedback UI.
 */
function AdminMatchingDetailsPage() {
  const { id } = useParams();
  const [matching, setMatching] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(false);
        const data = await getAdminMatchingById(id);
        if (!cancelled) setMatching(data);
      } catch (err) {
        if (!cancelled) {
          setError(true);
          setMatching(undefined);
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

  const mentorProfile = matching?.mentor?.mentorProfile;
  const selectedSlot = matching?.selectedSlot;
  const slots = matching?.slots ?? [];

  return (
    <Box>
      <Button
        component={RouterLink}
        to="/admin/matchings"
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
        Back to matchings
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
        Matching details
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
          <Typography sx={{ color: "#4A5568" }}>Loading matching…</Typography>
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          Could not load this matching. Please try again.
        </Alert>
      )}

      {!loading && !error && matching === null && (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          Matching not found.
        </Alert>
      )}

      {!loading && !error && matching && (
        <Stack spacing={2.5}>
          <Box component="section" sx={sectionSx}>
            <Typography
              component="h2"
              sx={{ fontWeight: 700, color: "#07142D", mb: 2 }}
            >
              Matching
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
              <Field label="ID">{matching.id}</Field>
              <Field label="Status">
                <AdminStatusChip status={matching.status} />
              </Field>
              <Field label="Created">
                {formatAdminDateTime(matching.createdAt)}
              </Field>
              <Field label="Updated">
                {formatAdminDateTime(matching.updatedAt)}
              </Field>
              <Field label="More times requested">
                {matching.moreTimesRequested ? "Yes" : "No"}
              </Field>
            </Box>
          </Box>

          <Box component="section" sx={sectionSx}>
            <Typography
              component="h2"
              sx={{ fontWeight: 700, color: "#07142D", mb: 2 }}
            >
              Mentor
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
              <Field label="Username">
                {matching.mentor?.username || "—"}
              </Field>
              <Field label="Email">{matching.mentor?.email || "—"}</Field>
            </Box>

            <Typography
              component="h3"
              sx={{ fontWeight: 700, color: "#07142D", mt: 2, mb: 1.5 }}
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
              </Box>
            )}
          </Box>

          <Box component="section" sx={sectionSx}>
            <Typography
              component="h2"
              sx={{ fontWeight: 700, color: "#07142D", mb: 2 }}
            >
              Mentee
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
              <Field label="Username">
                {matching.mentee?.username || "—"}
              </Field>
              <Field label="Email">{matching.mentee?.email || "—"}</Field>
            </Box>
          </Box>

          <Box component="section" sx={sectionSx}>
            <Typography
              component="h2"
              sx={{ fontWeight: 700, color: "#07142D", mb: 2 }}
            >
              Selected meeting time
            </Typography>
            {!selectedSlot ? (
              <Typography sx={{ color: "#6B7280" }}>
                No meeting time selected yet
              </Typography>
            ) : (
              <Typography sx={{ color: "#07142D", fontWeight: 600 }}>
                {formatAdminTimeRange(selectedSlot.start, selectedSlot.end)}
              </Typography>
            )}
          </Box>

          <Box component="section" sx={sectionSx}>
            <Typography
              component="h2"
              sx={{ fontWeight: 700, color: "#07142D", mb: 1 }}
            >
              Proposed slots
            </Typography>
            <Typography sx={{ color: "#6B7280", fontSize: "0.9rem", mb: 2 }}>
              All times proposed during scheduling. The selected slot is marked
              when applicable.
            </Typography>
            {slots.length === 0 ? (
              <Typography sx={{ color: "#6B7280" }}>
                No proposed slots yet.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {slots.map((slot) => {
                  const isSelected =
                    selectedSlot != null && slot.id === selectedSlot.id;
                  return (
                    <Box
                      key={slot.id}
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1,
                        px: 1.75,
                        py: 1.25,
                        borderRadius: 2,
                        border: isSelected
                          ? "1px solid rgba(247, 95, 138, 0.45)"
                          : "1px solid rgba(113, 128, 150, 0.2)",
                        backgroundColor: isSelected
                          ? "rgba(247, 95, 138, 0.08)"
                          : "rgba(248, 250, 252, 0.9)",
                      }}
                    >
                      <Typography sx={{ fontWeight: isSelected ? 700 : 500 }}>
                        {formatAdminTimeRange(slot.start, slot.end)}
                      </Typography>
                      {isSelected && (
                        <Chip
                          label="Selected"
                          size="small"
                          sx={{
                            fontWeight: 700,
                            backgroundColor: "rgba(247, 95, 138, 0.16)",
                            color: "#D93F68",
                          }}
                        />
                      )}
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>

          <Box component="section" sx={sectionSx}>
            <Typography
              component="h2"
              sx={{ fontWeight: 700, color: "#07142D", mb: 1 }}
            >
              Feedback
            </Typography>
            {/* Stage 4 returns feedback: null — feature does not exist yet. */}
            <Typography sx={{ color: "#6B7280" }}>
              Feedback is not available yet.
            </Typography>
          </Box>
        </Stack>
      )}
    </Box>
  );
}

export default AdminMatchingDetailsPage;
