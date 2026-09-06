import React from "react";
import {
  Box,
  Typography,
  Button,
  Avatar,
  Stack,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import StatusChip from "./StatusChip";
import { REQUEST_STATUS } from "./constants";
import { formatDate, formatDateTime } from "./utils";
import { useMatchingLanguage } from "./MatchingLanguageContext";

/**
 * Set to true (or pass showAvatar) when mentor images are available.
 * Layout does not depend on the avatar — it is easy to remove later.
 */
const SHOW_AVATAR_BY_DEFAULT = true;

function RequestCard({ request, showAvatar = SHOW_AVATAR_BY_DEFAULT }) {
  const { t, language } = useMatchingLanguage();
  const mentorName = request.mentor?.name || t.mentorFallback;
  const initials = mentorName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Box
      sx={{
        // Uniform physical padding so LTR/RTL cards keep the same proportions.
        p: { xs: 2, sm: 2.5 },
        borderRadius: 4,
        backgroundColor: "rgba(255, 255, 255, 0.82)",
        border: "1px solid rgba(255, 255, 255, 0.9)",
        boxShadow: "0 8px 24px rgba(7, 20, 45, 0.05)",
        backdropFilter: "blur(8px)",
        transition: "transform 200ms ease, box-shadow 200ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 12px 28px rgba(7, 20, 45, 0.08)",
        },
      }}
    >
      {/*
        Use CSS gap (not Stack spacing margins) so avatar/name/status gaps
        stay visually identical under page RTL.
      */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 1.75,
            minWidth: 0,
          }}
        >
          {showAvatar && (
            <Avatar
              src={request.mentor?.avatarUrl || undefined}
              alt=""
              sx={{
                width: 48,
                height: 48,
                flexShrink: 0,
                bgcolor: "rgba(247, 95, 138, 0.15)",
                color: "#F75F8A",
                fontWeight: 700,
                fontSize: "0.95rem",
              }}
            >
              {initials}
            </Avatar>
          )}

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
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
                  letterSpacing: "-0.01em",
                }}
              >
                {mentorName}
              </Typography>
              <StatusChip status={request.status} />
            </Box>

            <Stack spacing={0.5}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 0.75,
                }}
              >
                <CalendarMonthOutlinedIcon
                  sx={{ fontSize: 16, color: "#8A94A6", flexShrink: 0 }}
                />
                <Typography sx={{ fontSize: "0.875rem", color: "#4A5568" }}>
                  {t.requestedOn(formatDate(request.requestedAt, language))}
                </Typography>
              </Box>

              {request.status === REQUEST_STATUS.MATCHED && request.meetingAt && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 0.75,
                  }}
                >
                  <EventAvailableOutlinedIcon
                    sx={{ fontSize: 16, color: "#2F855A", flexShrink: 0 }}
                  />
                  <Typography
                    sx={{ fontSize: "0.875rem", color: "#2F855A", fontWeight: 600 }}
                  >
                    {t.meetingOn(formatDateTime(request.meetingAt, language))}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Box>

        <Button
          component={RouterLink}
          to={`/matching/${request.id}`}
          variant="contained"
          sx={{
            alignSelf: { xs: "stretch", sm: "center" },
            flexShrink: 0,
            px: 2.5,
            py: 1.1,
            borderRadius: 3,
            background: "linear-gradient(135deg, #FF6F91, #F75F8A)",
            boxShadow: "0 8px 20px rgba(247, 95, 138, 0.22)",
            "&:hover": {
              background: "linear-gradient(135deg, #FF7A9A, #E04872)",
              boxShadow: "0 10px 24px rgba(247, 95, 138, 0.3)",
            },
          }}
        >
          {t.viewRequest}
        </Button>
      </Box>
    </Box>
  );
}

export default RequestCard;
