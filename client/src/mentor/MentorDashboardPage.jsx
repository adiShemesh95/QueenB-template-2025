import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MentorLayout from "./MentorLayout";
import StatusChip from "../matching/StatusChip";
import { FILTER_ALL, REQUEST_STATUS } from "../matching/constants";
import { formatDate, formatTimeRange } from "../matching/utils";
import {
  getMentorRequests,
  getMyMentorProfile,
  proposeSlots,
  rejectMentorRequest,
  requestReschedule,
} from "./mentorService";
import { useMentorLanguage } from "./translations";

const DEFAULT_SESSION_DURATION_MINUTES = 60;

const MENTOR_STATUS_FILTER_VALUES = [
  FILTER_ALL,
  REQUEST_STATUS.PENDING_MENTOR,
  REQUEST_STATUS.PENDING_MENTEE,
  REQUEST_STATUS.MATCHED,
  REQUEST_STATUS.REJECTED,
];

const filterToggleGroupSx = {
  display: "inline-flex",
  flexWrap: "nowrap",
  gap: 1,
  "& .MuiToggleButtonGroup-grouped": {
    border: "1.5px solid transparent",
    borderRadius: "999px !important",
    px: 1.75,
    py: 0.6,
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.85rem",
    color: "#4A5568",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    whiteSpace: "nowrap",
    "&:not(:first-of-type)": {
      marginLeft: 0,
    },
    "&.Mui-selected": {
      backgroundColor: "rgba(247, 95, 138, 0.12)",
      color: "#D93F68",
      borderColor: "#F75F8A",
      "&:hover": {
        backgroundColor: "rgba(247, 95, 138, 0.18)",
      },
    },
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.92)",
    },
  },
};

const glassCardSx = {
  p: { xs: 2, sm: 2.5 },
  borderRadius: 4,
  backgroundColor: "rgba(255, 255, 255, 0.82)",
  border: "1px solid rgba(255, 255, 255, 0.9)",
  boxShadow: "0 8px 24px rgba(7, 20, 45, 0.05)",
  backdropFilter: "blur(8px)",
};

const primaryButtonSx = {
  px: 2.5,
  py: 1.1,
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

/** Non-MATCHED keep API order; MATCHED appended sorted by meeting time ascending. */
function orderMentorInboxRequests(requests) {
  const nonMatched = [];
  const matched = [];

  for (const request of requests) {
    if (request.status === REQUEST_STATUS.MATCHED) {
      matched.push(request);
    } else {
      nonMatched.push(request);
    }
  }

  matched.sort((a, b) => {
    const aTime = a.meetingAt
      ? new Date(a.meetingAt).getTime()
      : Number.POSITIVE_INFINITY;
    const bTime = b.meetingAt
      ? new Date(b.meetingAt).getTime()
      : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });

  return [...nonMatched, ...matched];
}

function emptySlotDraft() {
  return { startLocal: "" };
}

function localInputToIso(localValue) {
  if (!localValue) return null;
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/** Format a Date as a datetime-local input value in the browser's local timezone. */
function dateToLocalInput(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addMinutesToLocalInput(localValue, minutes) {
  if (!localValue || !Number.isFinite(minutes)) return "";
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) return "";
  date.setMinutes(date.getMinutes() + minutes);
  return dateToLocalInput(date);
}

function MentorRequestCard({
  request,
  onReject,
  onProposeSlots,
  onRequestReschedule,
  actionLoadingId,
  sessionDurationMinutes,
}) {
  const { t, language } = useMentorLanguage();
  const [slotDrafts, setSlotDrafts] = useState([
    emptySlotDraft(),
    emptySlotDraft(),
  ]);
  const [localError, setLocalError] = useState("");
  const busy = actionLoadingId === request.id;
  const menteeName = request.mentee?.username || t.menteeFallback;
  const canPropose = request.status === REQUEST_STATUS.PENDING_MENTOR;
  const canReject =
    request.status === REQUEST_STATUS.PENDING_MENTOR ||
    request.status === REQUEST_STATUS.PENDING_MENTEE;
  const canReschedule =
    request.status === REQUEST_STATUS.MATCHED && !request.rescheduleUsed;

  const updateStart = (index, value) => {
    setSlotDrafts((prev) =>
      prev.map((slot, i) =>
        i === index ? { ...slot, startLocal: value } : slot
      )
    );
  };

  const removeSlotDraft = (index) => {
    setSlotDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  const addSlotRow = () => {
    setSlotDrafts((prev) => [...prev, emptySlotDraft()]);
  };

  const handlePropose = async () => {
    setLocalError("");
    const slots = slotDrafts
      .map((draft) => {
        const startTime = localInputToIso(draft.startLocal);
        const endLocal = addMinutesToLocalInput(
          draft.startLocal,
          sessionDurationMinutes
        );
        const endTime = localInputToIso(endLocal);
        return { startTime, endTime };
      })
      .filter((slot) => slot.startTime && slot.endTime);

    if (slots.length === 0) {
      setLocalError(t.addStartTime);
      return;
    }

    await onProposeSlots(request.id, slots);
  };

  return (
    <Box sx={glassCardSx}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 1.5,
          mb: 1.5,
        }}
      >
        <Box>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 1,
              mb: 0.5,
            }}
          >
            <Typography
              component="h2"
              sx={{
                fontWeight: 700,
                fontSize: "1.05rem",
                color: "#07142D",
              }}
            >
              {menteeName}
            </Typography>
            <StatusChip status={request.status} />
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
            }}
          >
            <CalendarMonthOutlinedIcon
              sx={{ fontSize: 16, color: "#8A94A6" }}
            />
            <Typography sx={{ fontSize: "0.875rem", color: "#4A5568" }}>
              {t.requestedOn(formatDate(request.createdAt, language))}
            </Typography>
          </Box>
        </Box>

        {canReject && (
          <Button
            variant="outlined"
            disabled={busy}
            onClick={() => onReject(request.id)}
            sx={{
              px: 2,
              py: 1,
              borderRadius: 3,
              borderWidth: 1.5,
              borderColor: "rgba(113, 128, 150, 0.45)",
              color: "#4A5568",
              "&:hover": {
                borderWidth: 1.5,
                borderColor: "#4A5568",
                backgroundColor: "rgba(113, 128, 150, 0.08)",
              },
            }}
          >
            {t.reject}
          </Button>
        )}
      </Box>

      {request.status !== REQUEST_STATUS.MATCHED &&
        Array.isArray(request.suggestedSlots) &&
        request.suggestedSlots.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography
              sx={{
                fontWeight: 600,
                color: "#07142D",
                mb: 1,
                fontSize: "0.9rem",
              }}
            >
              {t.proposedTimes}
            </Typography>
            <Stack spacing={0.75}>
              {request.suggestedSlots.map((slot) => (
                <Typography
                  key={slot.id}
                  sx={{
                    fontSize: "0.9rem",
                    color: "#4A5568",
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    backgroundColor: "rgba(141, 216, 247, 0.12)",
                  }}
                >
                  {formatTimeRange(slot.start, slot.end, language)}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}

      {canPropose && (
        <Box
          sx={{
            mt: 1,
            pt: 2,
            borderTop: "1px solid rgba(7, 20, 45, 0.06)",
          }}
        >
          <Typography
            sx={{
              fontWeight: 600,
              color: "#07142D",
              mb: 1.25,
              fontSize: "0.95rem",
            }}
          >
            {t.offerTimeSlots}
          </Typography>

          <Stack spacing={1.25} sx={{ mb: 1.5 }}>
            {slotDrafts.map((draft, index) => {
              const endLocal = addMinutesToLocalInput(
                draft.startLocal,
                sessionDurationMinutes
              );
              return (
                <Stack
                  key={`slot-draft-${index}`}
                  direction="row"
                  spacing={1}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.25}
                    sx={{ flex: 1, minWidth: 0 }}
                  >
                    <TextField
                      label={t.startSlot(index + 1)}
                      type="datetime-local"
                      value={draft.startLocal}
                      onChange={(e) => updateStart(index, e.target.value)}
                      disabled={busy}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                    <TextField
                      label={t.endSlot(index + 1)}
                      type="datetime-local"
                      value={endLocal}
                      InputProps={{ readOnly: true }}
                      disabled={busy}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      size="small"
                    />
                  </Stack>
                  <IconButton
                    aria-label={t.removeDraftSlot(index + 1)}
                    onClick={() => removeSlotDraft(index)}
                    disabled={busy}
                    size="small"
                    sx={{
                      color: "#F75F8A",
                      mt: { xs: 0.5, sm: 0 },
                      "&:hover": {
                        backgroundColor: "rgba(247, 95, 138, 0.1)",
                      },
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              );
            })}
          </Stack>

          {localError ? (
            <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2 }}>
              {localError}
            </Alert>
          ) : null}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
            <Button
              variant="contained"
              disabled={busy}
              onClick={handlePropose}
              sx={primaryButtonSx}
            >
              {busy ? t.sending : t.sendProposedTimes}
            </Button>
            <Button
              variant="text"
              disabled={busy}
              onClick={addSlotRow}
              sx={{ color: "#4A5568", fontWeight: 600 }}
            >
              {t.addAnotherSlot}
            </Button>
          </Stack>
        </Box>
      )}

      {request.status === REQUEST_STATUS.PENDING_MENTEE && (
        <Typography sx={{ mt: 1, fontSize: "0.875rem", color: "#6B7280" }}>
          {t.waitingForMenteePick}
        </Typography>
      )}

      {request.status === REQUEST_STATUS.MATCHED && request.meetingAt && (
        <Typography
          sx={{ mt: 1, fontSize: "0.9rem", color: "#2F855A", fontWeight: 600 }}
        >
          {t.meetingLabel(
            formatTimeRange(
              request.meetingAt,
              request.selectedSlot?.end,
              language
            )
          )}
        </Typography>
      )}

      {canReschedule && (
        <Button
          variant="outlined"
          disabled={busy}
          onClick={() => onRequestReschedule(request.id)}
          sx={{
            mt: 1.5,
            px: 2.5,
            py: 1.1,
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
          {t.requestReschedule}
        </Button>
      )}
    </Box>
  );
}

function MentorDashboardPage() {
  const { t } = useMentorLanguage();
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState(FILTER_ALL);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(
    DEFAULT_SESSION_DURATION_MINUTES
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadRequests = async () => {
    const data = await getMentorRequests();
    setRequests(data);
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(false);
        const [profile, data] = await Promise.all([
          getMyMentorProfile(),
          getMentorRequests(),
        ]);
        if (!cancelled) {
          const duration = Number(profile?.sessionDuration);
          setSessionDurationMinutes(
            Number.isInteger(duration) && duration > 0
              ? duration
              : DEFAULT_SESSION_DURATION_MINUTES
          );
          setRequests(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(true);
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
  }, []);

  const handleReject = async (requestId) => {
    try {
      setActionLoadingId(requestId);
      setFeedback(null);
      await rejectMentorRequest(requestId);
      await loadRequests();
      setFeedback({
        severity: "info",
        message: t.requestDeclined,
      });
    } catch (err) {
      const message =
        err?.response?.data?.error?.message || t.rejectError;
      setFeedback({ severity: "error", message });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleProposeSlots = async (requestId, slots) => {
    try {
      setActionLoadingId(requestId);
      setFeedback(null);
      await proposeSlots(requestId, slots);
      await loadRequests();
      setFeedback({
        severity: "success",
        message: t.slotsSentSuccess,
      });
    } catch (err) {
      const message =
        err?.response?.data?.error?.message || t.slotsSendError;
      setFeedback({ severity: "error", message });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRequestReschedule = async (requestId) => {
    try {
      setActionLoadingId(requestId);
      setFeedback(null);
      await requestReschedule(requestId);
      await loadRequests();
      setFeedback({
        severity: "success",
        message: t.rescheduleSuccess,
      });
    } catch (err) {
      const message =
        err?.response?.data?.error?.message || t.rescheduleError;
      setFeedback({ severity: "error", message });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRequests =
    statusFilter === FILTER_ALL
      ? requests
      : requests.filter((request) => request.status === statusFilter);
  const visibleRequests = orderMentorInboxRequests(filteredRequests);

  return (
    <MentorLayout
      title={t.inboxTitle}
      subtitle={t.inboxSubtitle}
      backTo="/mentors"
      backLabel={t.mentors}
    >
      {feedback && (
        <Alert severity={feedback.severity} sx={{ mb: 2, borderRadius: 3 }}>
          {feedback.message}
        </Alert>
      )}

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
          <Typography sx={{ color: "#4A5568" }}>{t.loadingRequests}</Typography>
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {t.loadRequestsError}
        </Alert>
      )}

      {!loading && !error && requests.length === 0 && (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            px: 2,
            borderRadius: 4,
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            border: "1px dashed rgba(113, 128, 150, 0.35)",
          }}
        >
          <Typography sx={{ fontWeight: 600, color: "#07142D", mb: 0.5 }}>
            {t.emptyRequestsTitle}
          </Typography>
          <Typography sx={{ color: "#6B7280", fontSize: "0.95rem" }}>
            {t.emptyRequestsBody}
          </Typography>
        </Box>
      )}

      {!loading && !error && requests.length > 0 && (
        <>
          <Box
            sx={{
              mb: 2.5,
              overflowX: "auto",
              pb: 0.5,
              mx: { xs: -0.5, sm: 0 },
              px: { xs: 0.5, sm: 0 },
            }}
          >
            <ToggleButtonGroup
              exclusive
              value={statusFilter}
              onChange={(_event, next) => {
                if (next !== null) setStatusFilter(next);
              }}
              aria-label={t.filterAria}
              sx={filterToggleGroupSx}
            >
              {MENTOR_STATUS_FILTER_VALUES.map((value) => (
                <ToggleButton key={value} value={value}>
                  {t.filters[value]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {visibleRequests.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: 6,
                px: 2,
                borderRadius: 4,
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                border: "1px dashed rgba(113, 128, 150, 0.35)",
              }}
            >
              <Typography sx={{ fontWeight: 600, color: "#07142D", mb: 0.5 }}>
                {t.emptyFilterTitle}
              </Typography>
              <Typography sx={{ color: "#6B7280", fontSize: "0.95rem" }}>
                {t.emptyFilterBody}
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.75}>
              {visibleRequests.map((request) => (
                <MentorRequestCard
                  key={request.id}
                  request={request}
                  actionLoadingId={actionLoadingId}
                  sessionDurationMinutes={sessionDurationMinutes}
                  onReject={handleReject}
                  onProposeSlots={handleProposeSlots}
                  onRequestReschedule={handleRequestReschedule}
                />
              ))}
            </Stack>
          )}
        </>
      )}
    </MentorLayout>
  );
}

export default MentorDashboardPage;
