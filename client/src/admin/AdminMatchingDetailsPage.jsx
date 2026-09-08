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
 * Admin matching detail — GET /api/admin/matchings/:id.
 *
 * selectedSlot is the chosen meeting time (from matching.selected_slot_id).
 * slots[] is the full set of times proposed during scheduling.
 * Do not derive the meeting time from slots[].
 *
 * feedback is currently always null from Stage 4 — show "unavailable"
 * instead of inventing feedback UI.
 *
 * moreTimesRequested / rescheduleUsed are historical process flags from the
 * matching row — not statuses.
 */
function AdminMatchingDetailsPage() {
  const { id } = useParams();
  const { language, dir, t } = useAdminLanguage();
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
    <Box dir={dir} lang={language}>
      <Button
        component={RouterLink}
        to="/admin/matchings"
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
        {t.backToMatchings}
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
        {t.matchingDetailsTitle}
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
          <Typography sx={{ color: "#4A5568" }}>{t.loadingMatching}</Typography>
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {t.loadMatchingError}
        </Alert>
      )}

      {!loading && !error && matching === null && (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          {t.matchingNotFound}
        </Alert>
      )}

      {!loading && !error && matching && (
        <Stack spacing={2.5}>
          <Box component="section" sx={sectionSx}>
            <Typography
              component="h2"
              sx={{ fontWeight: 700, color: "#07142D", mb: 2 }}
            >
              {t.sectionMatching}
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
              <Field label={t.fieldId}>{matching.id}</Field>
              <Field label={t.statusLabel}>
                <AdminStatusChip status={matching.status} />
              </Field>
              <Field label={t.colCreated}>
                {formatAdminDateTime(matching.createdAt, language)}
              </Field>
              <Field label={t.fieldUpdated}>
                {formatAdminDateTime(matching.updatedAt, language)}
              </Field>
              <Field label={t.fieldMoreTimesRequested}>
                {matching.moreTimesRequested ? t.yes : t.no}
              </Field>
              <Field label={t.fieldRescheduleUsed}>
                {matching.rescheduleUsed ? t.yes : t.no}
              </Field>
            </Box>
          </Box>

          <Box component="section" sx={sectionSx}>
            <Typography
              component="h2"
              sx={{ fontWeight: 700, color: "#07142D", mb: 2 }}
            >
              {t.sectionMentor}
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
              <Field label={t.fieldUsername}>
                {matching.mentor?.username || t.emDash}
              </Field>
              <Field label={t.fieldEmail}>
                {matching.mentor?.email || t.emDash}
              </Field>
            </Box>

            <Typography
              component="h3"
              sx={{ fontWeight: 700, color: "#07142D", mt: 2, mb: 1.5 }}
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
              </Box>
            )}
          </Box>

          <Box component="section" sx={sectionSx}>
            <Typography
              component="h2"
              sx={{ fontWeight: 700, color: "#07142D", mb: 2 }}
            >
              {t.sectionMentee}
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
              <Field label={t.fieldUsername}>
                {matching.mentee?.username || t.emDash}
              </Field>
              <Field label={t.fieldEmail}>
                {matching.mentee?.email || t.emDash}
              </Field>
            </Box>
          </Box>

          <Box component="section" sx={sectionSx}>
            <Typography
              component="h2"
              sx={{ fontWeight: 700, color: "#07142D", mb: 2 }}
            >
              {t.sectionSelectedMeetingTime}
            </Typography>
            {!selectedSlot ? (
              <Typography sx={{ color: "#6B7280" }}>
                {t.noMeetingTimeSelected}
              </Typography>
            ) : (
              <Typography sx={{ color: "#07142D", fontWeight: 600 }}>
                {formatAdminTimeRange(
                  selectedSlot.start,
                  selectedSlot.end,
                  language
                )}
              </Typography>
            )}
          </Box>

          <Box component="section" sx={sectionSx}>
            <Typography
              component="h2"
              sx={{ fontWeight: 700, color: "#07142D", mb: 1 }}
            >
              {t.sectionProposedSlots}
            </Typography>
            <Typography sx={{ color: "#6B7280", fontSize: "0.9rem", mb: 2 }}>
              {t.proposedSlotsHint}
            </Typography>
            {slots.length === 0 ? (
              <Typography sx={{ color: "#6B7280" }}>
                {t.noProposedSlots}
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
                        {formatAdminTimeRange(slot.start, slot.end, language)}
                      </Typography>
                      {isSelected && (
                        <Chip
                          label={t.selectedChip}
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
              {t.sectionFeedback}
            </Typography>
            {/* Stage 4 returns feedback: null — feature does not exist yet. */}
            <Typography sx={{ color: "#6B7280" }}>
              {t.feedbackUnavailable}
            </Typography>
          </Box>
        </Stack>
      )}
    </Box>
  );
}

export default AdminMatchingDetailsPage;
