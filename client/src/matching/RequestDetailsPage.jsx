import React, { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Radio,
  Stack,
  Typography,
} from "@mui/material";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import MatchingLayout from "./MatchingLayout";
import {
  getRequestById,
  requestMoreTimes,
  selectTimeSlot,
} from "./matchingService";
import { REQUEST_STATUS } from "./constants";
import { formatDate, formatDateTime, formatTimeRange } from "./utils";
import { useMatchingLanguage } from "./MatchingLanguageContext";

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

const detailCardSx = {
  p: { xs: 2.25, sm: 3 },
  borderRadius: 4,
  backgroundColor: "rgba(255, 255, 255, 0.86)",
  border: "1px solid rgba(255, 255, 255, 0.95)",
  boxShadow: "0 8px 24px rgba(7, 20, 45, 0.05)",
  backdropFilter: "blur(8px)",
};

function StatusBanner({ icon, title, description, tone = "neutral" }) {
  const tones = {
    waiting: {
      bg: "rgba(141, 216, 247, 0.18)",
      iconColor: "#0B6E99",
    },
    success: {
      bg: "rgba(72, 187, 120, 0.14)",
      iconColor: "#2F855A",
    },
    declined: {
      bg: "rgba(113, 128, 150, 0.12)",
      iconColor: "#4A5568",
    },
    action: {
      bg: "rgba(247, 95, 138, 0.1)",
      iconColor: "#D93F68",
    },
    neutral: {
      bg: "rgba(248, 251, 255, 0.9)",
      iconColor: "#F75F8A",
    },
  };
  const palette = tones[tone] || tones.neutral;

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.75,
        p: 2,
        mb: 2.5,
        borderRadius: 3,
        backgroundColor: palette.bg,
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          color: palette.iconColor,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 700, color: "#07142D", mb: 0.35 }}>
          {title}
        </Typography>
        <Typography sx={{ color: "#4A5568", fontSize: "0.925rem", lineHeight: 1.55 }}>
          {description}
        </Typography>
      </Box>
    </Box>
  );
}

function RequestDetailsPage() {
  const { id } = useParams();
  const { t, language, dir } = useMatchingLanguage();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackKey, setFeedbackKey] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErrorKey(null);
        setFeedbackKey(null);
        const data = await getRequestById(id);
        if (cancelled) return;
        if (!data) {
          setErrorKey("requestNotFound");
          setRequest(null);
        } else {
          setRequest(data);
          setSelectedSlotId(null);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorKey("loadRequestError");
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

  const handleSelectSlot = async () => {
    if (!selectedSlotId || !request) return;
    try {
      setActionLoading(true);
      setFeedbackKey(null);
      const updated = await selectTimeSlot(request.id, selectedSlotId);
      setRequest(updated);
      setFeedbackKey({ severity: "success", key: "selectSuccess" });
    } catch (err) {
      setFeedbackKey({ severity: "error", key: "selectError" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestMoreTimes = async () => {
    if (!request) return;
    try {
      setActionLoading(true);
      setFeedbackKey(null);
      const updated = await requestMoreTimes(request.id);
      setRequest(updated);
      setFeedbackKey({ severity: "info", key: "moreTimesSuccess" });
    } catch (err) {
      setFeedbackKey({ severity: "warning", key: "moreTimesError" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <MatchingLayout backTo="/my-requests" backLabel={t.myRequests}>
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
          <Typography sx={{ color: "#4A5568" }}>{t.loadingRequest}</Typography>
        </Box>
      </MatchingLayout>
    );
  }

  if (errorKey || !request) {
    return (
      <MatchingLayout backTo="/my-requests" backLabel={t.myRequests}>
        <Alert severity="error" sx={{ borderRadius: 3, mb: 2 }}>
          {t[errorKey] || t.requestNotFoundShort}
        </Alert>
        <Button component={RouterLink} to="/my-requests" variant="outlined">
          {t.backToMyRequests}
        </Button>
      </MatchingLayout>
    );
  }

  const mentorName = request.mentor?.name || t.mentorFallback;
  const initials = mentorName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <MatchingLayout
      title={t.requestDetails}
      subtitle={t.requestDetailsSubtitle(mentorName)}
      backTo="/my-requests"
      backLabel={t.myRequests}
    >
      <Box sx={detailCardSx}>
        <Stack
          direction="row"
          spacing={1.75}
          alignItems="center"
          sx={{ mb: 2.5 }}
        >
          <Avatar
            src={request.mentor?.avatarUrl || undefined}
            alt=""
            sx={{
              width: 56,
              height: 56,
              bgcolor: "rgba(247, 95, 138, 0.15)",
              color: "#F75F8A",
              fontWeight: 700,
            }}
          >
            {initials}
          </Avatar>
          <Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "1.2rem",
                color: "#07142D",
                letterSpacing: "-0.01em",
              }}
            >
              {mentorName}
            </Typography>
            <Typography sx={{ color: "#6B7280", fontSize: "0.9rem" }}>
              {t.requestedOn(formatDate(request.requestedAt, language))}
            </Typography>
          </Box>
        </Stack>

        {feedbackKey && (
          <Alert severity={feedbackKey.severity} sx={{ mb: 2.5, borderRadius: 3 }}>
            {t[feedbackKey.key]}
          </Alert>
        )}

        {request.status === REQUEST_STATUS.PENDING_MENTOR && (
          <StatusBanner
            tone="waiting"
            icon={<HourglassEmptyRoundedIcon />}
            title={t.pendingMentorTitle}
            description={t.pendingMentorDescription}
          />
        )}

        {request.status === REQUEST_STATUS.PENDING_MENTEE && (
          <>
            <StatusBanner
              tone="action"
              icon={<AccessTimeRoundedIcon />}
              title={t.pendingMenteeTitle}
              description={t.pendingMenteeDescription}
            />

            <Typography
              sx={{
                fontWeight: 600,
                color: "#07142D",
                mb: 1.25,
                fontSize: "0.95rem",
              }}
            >
              {t.suggestedTimes}
            </Typography>

            <Stack spacing={1.25} sx={{ mb: 2.5 }}>
              {request.suggestedSlots.map((slot) => {
                const selected = selectedSlotId === slot.id;
                return (
                  <Box
                    key={slot.id}
                    component="button"
                    type="button"
                    onClick={() => setSelectedSlotId(slot.id)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      width: "100%",
                      textAlign: "start",
                      cursor: "pointer",
                      p: 1.5,
                      borderRadius: 3,
                      border: selected
                        ? "1.5px solid #F75F8A"
                        : "1.5px solid rgba(113, 128, 150, 0.25)",
                      backgroundColor: selected
                        ? "rgba(247, 95, 138, 0.06)"
                        : "rgba(255, 255, 255, 0.7)",
                      transition: "border-color 150ms ease, background-color 150ms ease",
                      font: "inherit",
                      color: "inherit",
                      direction: dir,
                      "&:hover": {
                        borderColor: "#F75F8A",
                        backgroundColor: "rgba(247, 95, 138, 0.05)",
                      },
                      "&:focus-visible": {
                        outline: "2px solid #F75F8A",
                        outlineOffset: "2px",
                      },
                    }}
                  >
                    <Radio
                      checked={selected}
                      value={slot.id}
                      tabIndex={-1}
                      disableRipple
                      sx={{
                        p: 0.5,
                        color: "#C4CDD8",
                        "&.Mui-checked": { color: "#F75F8A" },
                      }}
                    />
                    <Typography sx={{ fontWeight: 600, color: "#07142D" }}>
                      {formatTimeRange(slot.start, slot.end, language)}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.25}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Button
                variant="contained"
                disabled={!selectedSlotId || actionLoading}
                onClick={handleSelectSlot}
                sx={primaryButtonSx}
              >
                {t.confirmPreferredTime}
              </Button>
              <Button
                variant="outlined"
                disabled={request.moreTimesRequested || actionLoading}
                onClick={handleRequestMoreTimes}
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
                {request.moreTimesRequested
                  ? t.moreTimesAlreadyRequested
                  : t.requestMoreTimes}
              </Button>
            </Stack>

            {request.moreTimesRequested && (
              <Typography
                sx={{ mt: 1.5, fontSize: "0.85rem", color: "#6B7280" }}
              >
                {t.moreTimesHint}
              </Typography>
            )}
          </>
        )}

        {request.status === REQUEST_STATUS.MATCHED && (
          <>
            <StatusBanner
              tone="success"
              icon={<EventAvailableOutlinedIcon />}
              title={t.matchedTitle}
              description={t.matchedDescription}
            />
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                backgroundColor: "rgba(72, 187, 120, 0.08)",
                border: "1px solid rgba(72, 187, 120, 0.25)",
              }}
            >
              <Typography
                sx={{ fontSize: "0.8rem", color: "#2F855A", fontWeight: 600, mb: 0.5 }}
              >
                {t.scheduledMeeting}
              </Typography>
              <Typography sx={{ fontWeight: 700, color: "#07142D", fontSize: "1.1rem" }}>
                {formatDateTime(request.meetingAt, language)}
              </Typography>
            </Box>
          </>
        )}

        {request.status === REQUEST_STATUS.REJECTED && (
          <StatusBanner
            tone="declined"
            icon={<HighlightOffRoundedIcon />}
            title={t.rejectedTitle}
            description={t.rejectedDescription}
          />
        )}
      </Box>
    </MatchingLayout>
  );
}

export default RequestDetailsPage;
