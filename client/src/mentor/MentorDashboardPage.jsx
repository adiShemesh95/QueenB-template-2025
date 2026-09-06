import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import MentorLayout from "./MentorLayout";
import StatusChip from "../matching/StatusChip";
import { REQUEST_STATUS } from "../matching/constants";
import { formatDate, formatTimeRange } from "../matching/utils";
import {
  getMentorRequests,
  proposeSlots,
  rejectMentorRequest,
} from "./mentorService";

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

function emptySlotDraft() {
  return { startLocal: "", endLocal: "" };
}

function localInputToIso(localValue) {
  if (!localValue) return null;
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function MentorRequestCard({
  request,
  onReject,
  onProposeSlots,
  actionLoadingId,
}) {
  const [slotDrafts, setSlotDrafts] = useState([
    emptySlotDraft(),
    emptySlotDraft(),
  ]);
  const [localError, setLocalError] = useState("");
  const busy = actionLoadingId === request.id;
  const menteeName = request.mentee?.username || "Mentee";
  const canPropose = request.status === REQUEST_STATUS.PENDING_MENTOR;
  const canReject =
    request.status === REQUEST_STATUS.PENDING_MENTOR ||
    request.status === REQUEST_STATUS.PENDING_MENTEE;

  const updateSlot = (index, field, value) => {
    setSlotDrafts((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  };

  const addSlotRow = () => {
    setSlotDrafts((prev) => [...prev, emptySlotDraft()]);
  };

  const handlePropose = async () => {
    setLocalError("");
    const slots = slotDrafts
      .map((draft) => ({
        startTime: localInputToIso(draft.startLocal),
        endTime: localInputToIso(draft.endLocal),
      }))
      .filter((slot) => slot.startTime && slot.endTime);

    if (slots.length === 0) {
      setLocalError("Add at least one complete start/end time.");
      return;
    }

    for (const slot of slots) {
      if (new Date(slot.endTime) <= new Date(slot.startTime)) {
        setLocalError("Each end time must be after its start time.");
        return;
      }
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
              Requested {formatDate(request.createdAt)}
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
            Reject
          </Button>
        )}
      </Box>

      {Array.isArray(request.suggestedSlots) &&
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
              Proposed times
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
                  {formatTimeRange(slot.start, slot.end)}
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
            Offer time slots
          </Typography>

          <Stack spacing={1.25} sx={{ mb: 1.5 }}>
            {slotDrafts.map((draft, index) => (
              <Stack
                key={`slot-draft-${index}`}
                direction={{ xs: "column", sm: "row" }}
                spacing={1.25}
              >
                <TextField
                  label={`Start ${index + 1}`}
                  type="datetime-local"
                  value={draft.startLocal}
                  onChange={(e) =>
                    updateSlot(index, "startLocal", e.target.value)
                  }
                  disabled={busy}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
                <TextField
                  label={`End ${index + 1}`}
                  type="datetime-local"
                  value={draft.endLocal}
                  onChange={(e) =>
                    updateSlot(index, "endLocal", e.target.value)
                  }
                  disabled={busy}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Stack>
            ))}
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
              {busy ? "Sending…" : "Send proposed times"}
            </Button>
            <Button
              variant="text"
              disabled={busy}
              onClick={addSlotRow}
              sx={{ color: "#4A5568", fontWeight: 600 }}
            >
              Add another slot
            </Button>
          </Stack>
        </Box>
      )}

      {request.status === REQUEST_STATUS.PENDING_MENTEE && (
        <Typography sx={{ mt: 1, fontSize: "0.875rem", color: "#6B7280" }}>
          Waiting for the mentee to pick a time.
        </Typography>
      )}

      {request.status === REQUEST_STATUS.MATCHED && request.meetingAt && (
        <Typography
          sx={{ mt: 1, fontSize: "0.9rem", color: "#2F855A", fontWeight: 600 }}
        >
          Meeting: {formatTimeRange(request.meetingAt, request.selectedSlot?.end)}
        </Typography>
      )}
    </Box>
  );
}

function MentorDashboardPage() {
  const [requests, setRequests] = useState([]);
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
        const data = await getMentorRequests();
        if (!cancelled) setRequests(data);
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
        message: "Request declined.",
      });
    } catch (err) {
      const message =
        err?.response?.data?.error?.message ||
        "Unable to reject this request.";
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
        message: "Time slots sent to the mentee.",
      });
    } catch (err) {
      const message =
        err?.response?.data?.error?.message ||
        "Unable to send time slots. Please try again.";
      setFeedback({ severity: "error", message });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <MentorLayout
      title="Mentor inbox"
      subtitle="Review incoming requests, propose meeting times, or decline."
      backTo="/mentors"
      backLabel="Mentors"
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
          <Typography sx={{ color: "#4A5568" }}>Loading requests…</Typography>
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          Unable to load mentor requests right now.
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
            No requests yet
          </Typography>
          <Typography sx={{ color: "#6B7280", fontSize: "0.95rem" }}>
            When mentees request a session with you, they will show up here.
          </Typography>
        </Box>
      )}

      {!loading && !error && requests.length > 0 && (
        <Stack spacing={1.75}>
          {requests.map((request) => (
            <MentorRequestCard
              key={request.id}
              request={request}
              actionLoadingId={actionLoadingId}
              onReject={handleReject}
              onProposeSlots={handleProposeSlots}
            />
          ))}
        </Stack>
      )}
    </MentorLayout>
  );
}

export default MentorDashboardPage;
