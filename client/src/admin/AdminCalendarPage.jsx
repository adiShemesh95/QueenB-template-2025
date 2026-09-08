import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { Link as RouterLink } from "react-router-dom";
import { getAdminMatchings } from "./adminService";
import {
  ADMIN_CALENDAR_LEGEND_STATUSES,
  getAdminStatusColors,
  toAdminCalendarEvents,
} from "./adminConstants";
import AdminStatusChip from "./AdminStatusChip";
import {
  formatAdminClockRange,
  formatAdminDuration,
  formatAdminLongDate,
} from "./adminFormat";
import { getAdminUiStatusLabel, useAdminLanguage } from "./translations";

const paperSx = {
  borderRadius: 3,
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  border: "1px solid rgba(7, 20, 45, 0.06)",
  boxShadow: "0 8px 24px rgba(7, 20, 45, 0.05)",
};

/** Compact calendar day cells — avoid tall stretched cards. */
const DAY_CELL_MIN_HEIGHT = { xs: 64, sm: 72, md: 76 };

const MONTH_LOCALES = {
  en: "en-GB",
  he: "he-IL",
  ar: "ar",
};

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function toDayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseEventDate(value) {
  if (value == null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/**
 * Sunday-first month grid including adjacent-month days (muted).
 * Returns { date, inCurrentMonth } so leading/trailing days stay visible.
 */
function buildMonthCells(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const sundayOffset = first.getDay();
  const cells = [];

  for (let i = 0; i < sundayOffset; i += 1) {
    cells.push({
      date: new Date(year, month, 1 - sundayOffset + i),
      inCurrentMonth: false,
    });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: new Date(year, month, day),
      inCurrentMonth: true,
    });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    cells.push({
      date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
      inCurrentMonth: false,
    });
  }
  return cells;
}

function StatusLegend({ t }) {
  return (
    <Stack
      direction="row"
      spacing={2}
      flexWrap="wrap"
      useFlexGap
      aria-label={t.statusLegendAria}
      sx={{ mb: 2 }}
    >
      {ADMIN_CALENDAR_LEGEND_STATUSES.map((status) => {
        const colors = getAdminStatusColors(status);
        return (
          <Box
            key={status}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#4A5568",
            }}
          >
            <Box
              aria-hidden="true"
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: colors.dot,
                flexShrink: 0,
              }}
            />
            {getAdminUiStatusLabel(status, t)}
          </Box>
        );
      })}
    </Stack>
  );
}

function MeetingDetailsEmpty({ t }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: { xs: 220, md: 280 },
      }}
    >
      <Typography
        component="h2"
        sx={{
          fontWeight: 700,
          fontSize: "1.15rem",
          color: "#07142D",
          letterSpacing: "-0.02em",
          mb: 3,
        }}
      >
        {t.meetingDetailsTitle}
      </Typography>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          px: 1,
          py: 2,
        }}
      >
        <Box
          aria-hidden="true"
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
            backgroundColor: "rgba(247, 95, 138, 0.1)",
            color: "#F75F8A",
          }}
        >
          <CalendarMonthOutlinedIcon sx={{ fontSize: 30 }} />
        </Box>
        <Typography sx={{ fontWeight: 700, color: "#07142D", mb: 0.75 }}>
          {t.noMeetingSelected}
        </Typography>
        <Typography sx={{ color: "#6B7280", fontSize: "0.9rem", maxWidth: 220, lineHeight: 1.5 }}>
          {t.noMeetingSelectedHint}
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * Summary-only Meeting Details panel.
 * Uses the Admin matchings report row already in memory — no extra detail fetch.
 * "View full details" reuses /admin/matchings/:id instead of duplicating that page.
 */
function MeetingDetailsContent({ event, onClose, t, language, dir }) {
  const duration = formatAdminDuration(event.start, event.end);
  const timeLabel = formatAdminClockRange(event.start, event.end, language);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography
          component="h2"
          sx={{
            fontWeight: 700,
            fontSize: "1.15rem",
            color: "#07142D",
            letterSpacing: "-0.02em",
          }}
        >
          {t.meetingDetailsTitle}
        </Typography>
        <IconButton
          aria-label={t.closeMeetingDetailsAria}
          onClick={onClose}
          size="small"
          sx={{ color: "#4A5568" }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Typography
        sx={{
          fontWeight: 700,
          fontSize: "1.05rem",
          color: "#07142D",
          mb: 1.25,
          wordBreak: "break-word",
        }}
      >
        {event.title}
      </Typography>

      <Box sx={{ mb: 2 }}>
        <AdminStatusChip status={event.status} />
      </Box>

      <Divider sx={{ mb: 2, borderColor: "rgba(7, 20, 45, 0.08)" }} />

      <Stack spacing={2} sx={{ flex: 1, mb: 2.5 }}>
        <DetailBlock label={t.fieldDate}>
          {formatAdminLongDate(event.start, language)}
        </DetailBlock>

        <DetailBlock label={t.fieldTime}>
          {timeLabel}
          {duration ? (
            <Typography
              component="span"
              sx={{ color: "#6B7280", fontWeight: 500, ml: 0.75 }}
            >
              ({duration})
            </Typography>
          ) : null}
        </DetailBlock>

        <DetailBlock label={t.colMentor}>
          <Box>{event.mentor?.username || t.emDash}</Box>
          <Typography sx={{ color: "#6B7280", fontSize: "0.85rem" }}>
            {event.mentor?.email || t.emDash}
          </Typography>
        </DetailBlock>

        <DetailBlock label={t.colMentee}>
          <Box>{event.mentee?.username || t.emDash}</Box>
          <Typography sx={{ color: "#6B7280", fontSize: "0.85rem" }}>
            {event.mentee?.email || t.emDash}
          </Typography>
        </DetailBlock>

        <DetailBlock label={t.statusLabel}>
          {getAdminUiStatusLabel(event.status, t)}
        </DetailBlock>
      </Stack>

      <Button
        component={RouterLink}
        to={`/admin/matchings/${event.id}`}
        variant="contained"
        fullWidth
        endIcon={
          <ArrowForwardRoundedIcon
            sx={{
              // Forward/details: point with reading flow (→ LTR, ← RTL)
              transform: dir === "rtl" ? "scaleX(-1)" : "none",
            }}
          />
        }
        sx={{
          mt: "auto",
          textTransform: "none",
          fontWeight: 700,
          borderRadius: 999,
          py: 1.1,
          backgroundColor: "#F75F8A",
          boxShadow: "none",
          "&:hover": {
            backgroundColor: "#E04872",
            boxShadow: "none",
          },
        }}
      >
        {t.viewFullDetails}
      </Button>
    </Box>
  );
}

function DetailBlock({ label, children }) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: "0.7rem",
          fontWeight: 700,
          color: "#6B7280",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          mb: 0.4,
        }}
      >
        {label}
      </Typography>
      <Typography
        component="div"
        sx={{ fontWeight: 600, color: "#07142D", fontSize: "0.95rem" }}
      >
        {children}
      </Typography>
    </Box>
  );
}

/**
 * Admin Calendar — interactive month view of scheduled matching meetings.
 *
 * WHY:
 * - selectedSlot is the authoritative scheduled meeting time.
 * - Proposed slots are intentionally not rendered as meetings.
 * - The month grid stays visible even with zero events (empty calendar ≠ empty page).
 * - Desktop always shows a Meeting Details column (~30%); click fills the summary
 *   (does not navigate away). Full detail stays on /admin/matchings/:id.
 * - Legend lists statuses that can appear as scheduled events today:
 *   MATCHED (active) and CANCELLED (cancelled after a slot was selected;
 *   selected_slot_id is kept, so the meeting stays on the Calendar).
 */
function AdminCalendarPage() {
  const { language, dir, t } = useAdminLanguage();
  const [matchings, setMatchings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(new Date())
  );
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMatchings() {
      try {
        setLoading(true);
        setError(false);
        const data = await getAdminMatchings();
        if (!cancelled) setMatchings(data);
      } catch (err) {
        if (!cancelled) {
          setError(true);
          console.error(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMatchings();
    return () => {
      cancelled = true;
    };
  }, []);

  // selectedSlot-only events — see toAdminCalendarEvents for WHY.
  const events = useMemo(
    () => toAdminCalendarEvents(matchings),
    [matchings]
  );

  const eventsByDay = useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      const start = parseEventDate(event.start);
      if (!start) return;
      const key = toDayKey(start);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({ ...event, startDate: start });
    });
    map.forEach((list) => {
      list.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    });
    return map;
  }, [events]);

  const monthCells = useMemo(
    () => buildMonthCells(visibleMonth),
    [visibleMonth]
  );

  // Today highlight is computed from the real current date (new Date()),
  // comparing full year+month+day via toDayKey — never a hardcoded day number.
  const todayKey = toDayKey(new Date());

  const monthTitleFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(MONTH_LOCALES[language] || "en-GB", {
        month: "long",
        year: "numeric",
      }),
    [language]
  );
  const monthLabel = monthTitleFormatter.format(visibleMonth);

  const eventsThisMonth = useMemo(() => {
    const y = visibleMonth.getFullYear();
    const m = visibleMonth.getMonth();
    return events.filter((event) => {
      const start = parseEventDate(event.start);
      if (!start) return false;
      return start.getFullYear() === y && start.getMonth() === m;
    });
  }, [events, visibleMonth]);

  const closePanel = () => setSelectedEvent(null);

  return (
    <Box
      dir={dir}
      lang={language}
      sx={{
        // Keep the page balanced — do not stretch edge-to-edge on wide desktops.
        maxWidth: 1120,
        mx: "auto",
        width: "100%",
      }}
    >
      <Typography
        component="h1"
        sx={{
          fontSize: { xs: "1.6rem", sm: "1.85rem" },
          fontWeight: 700,
          color: "#07142D",
          letterSpacing: "-0.02em",
          mb: 0.5,
        }}
      >
        {t.calendarTitle}
      </Typography>
      <Typography
        sx={{
          color: "#4A5568",
          mb: 1.5,
          maxWidth: 640,
          lineHeight: 1.5,
          fontSize: "0.95rem",
        }}
      >
        {t.calendarSubtitle}
      </Typography>

      <StatusLegend t={t} />

      {loading && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
            py: 6,
          }}
        >
          <CircularProgress size={36} sx={{ color: "#F75F8A" }} />
          <Typography sx={{ color: "#4A5568" }}>{t.loadingCalendar}</Typography>
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: 3, mb: 2 }}>
          {t.loadCalendarError}
        </Alert>
      )}

      {/* ~70% calendar / ~30% details — panel always visible on desktop. */}
      {!loading && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 7fr) minmax(260px, 3fr)" },
            alignItems: "stretch",
            gap: { xs: 2, md: 2.5 },
          }}
        >
          <Box
            sx={{
              ...paperSx,
              minWidth: 0,
              p: { xs: 1.25, sm: 1.75 },
              overflow: "auto",
            }}
          >
            {/* Month nav on the left; Today on the right */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              useFlexGap
              sx={{ mb: 1.5 }}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                useFlexGap
                flexWrap="wrap"
                // Keep chronological arrow placement: left = previous, right = next
                // even when the page is RTL (Hebrew/Arabic).
                dir="ltr"
                sx={{ direction: "ltr" }}
              >
                <IconButton
                  onClick={() => setVisibleMonth((m) => addMonths(m, -1))}
                  aria-label={t.previousMonthAria}
                  size="small"
                  sx={{ color: "#4A5568" }}
                >
                  <ChevronLeftRoundedIcon />
                </IconButton>
                <Typography
                  component="h2"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "1rem", sm: "1.15rem" },
                    color: "#07142D",
                    letterSpacing: "-0.02em",
                    px: 0.5,
                  }}
                >
                  {monthLabel}
                </Typography>
                <IconButton
                  onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
                  aria-label={t.nextMonthAria}
                  size="small"
                  sx={{ color: "#4A5568" }}
                >
                  <ChevronRightRoundedIcon />
                </IconButton>
              </Stack>
              <Button
                onClick={() => setVisibleMonth(startOfMonth(new Date()))}
                aria-label={t.goToCurrentMonthAria}
                size="small"
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  color: "#D93F68",
                  border: "1px solid rgba(247, 95, 138, 0.35)",
                  borderRadius: 999,
                  px: 1.75,
                  minWidth: 0,
                }}
              >
                {t.today}
              </Button>
            </Stack>

            {!error && eventsThisMonth.length === 0 && (
              <Typography
                sx={{
                  color: "#6B7280",
                  fontSize: "0.85rem",
                  mb: 1,
                }}
              >
                {t.noMeetingsThisMonth}
              </Typography>
            )}

            <Box
              role="grid"
              aria-label={t.calendarGridAria(monthLabel)}
              sx={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                // 1px gap + shared border color = clean cell lines without tall cards
                gap: "1px",
                backgroundColor: "rgba(7, 20, 45, 0.1)",
                border: "1px solid rgba(7, 20, 45, 0.1)",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              {t.weekdayLabels.map((label) => (
                <Box
                  key={label}
                  role="columnheader"
                  sx={{
                    px: 0.5,
                    py: 0.65,
                    textAlign: "center",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "#6B7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    backgroundColor: "rgba(247, 250, 252, 0.98)",
                  }}
                >
                  {label}
                </Box>
              ))}

              {monthCells.map(({ date: cellDate, inCurrentMonth }) => {
                const dayKey = toDayKey(cellDate);
                const dayEvents = inCurrentMonth
                  ? eventsByDay.get(dayKey) || []
                  : [];
                const isToday = dayKey === todayKey;

                return (
                  <Box
                    key={dayKey}
                    role="gridcell"
                    aria-label={cellDate.toDateString()}
                    aria-current={isToday ? "date" : undefined}
                    sx={{
                      position: "relative",
                      boxSizing: "border-box",
                      minHeight: DAY_CELL_MIN_HEIGHT,
                      height: DAY_CELL_MIN_HEIGHT,
                      overflow: "hidden",
                      borderRadius: 0,
                      backgroundColor: isToday
                        ? "rgba(247, 95, 138, 0.08)"
                        : inCurrentMonth
                          ? "#FFFFFF"
                          : "rgba(247, 250, 252, 0.95)",
                      p: 0.5,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        display: "block",
                        alignSelf: "flex-end",
                        fontSize: "0.72rem",
                        fontWeight: isToday ? 800 : 600,
                        lineHeight: 1.2,
                        px: 0.25,
                        pt: 0.1,
                        // Keep the day number inside the cell box.
                        position: "relative",
                        color: isToday
                          ? "#D93F68"
                          : inCurrentMonth
                            ? "#07142D"
                            : "#A0AEC0",
                      }}
                    >
                      {cellDate.getDate()}
                    </Typography>

                    <Stack
                      spacing={0.35}
                      sx={{
                        flex: 1,
                        minHeight: 0,
                        overflow: "hidden",
                        mt: 0.25,
                      }}
                    >
                      {dayEvents.map((event) => {
                        const colors = getAdminStatusColors(event.status);
                        const statusLabel = getAdminUiStatusLabel(
                          event.status,
                          t
                        );
                        const clock = formatAdminClockRange(
                          event.start,
                          event.end,
                          language
                        );
                        const isSelected = selectedEvent?.id === event.id;

                        return (
                          <Box
                            key={event.id}
                            component="button"
                            type="button"
                            onClick={() => setSelectedEvent(event)}
                            title={`${event.title} · ${statusLabel} · ${clock}`}
                            aria-label={t.showMeetingDetailsAria(
                              event.title,
                              statusLabel,
                              clock
                            )}
                            aria-pressed={isSelected}
                            sx={{
                              display: "block",
                              width: "100%",
                              textAlign: "left",
                              cursor: "pointer",
                              border: isSelected
                                ? `1px solid ${colors.border}`
                                : "1px solid transparent",
                              px: 0.5,
                              py: 0.25,
                              borderRadius: 0.75,
                              backgroundColor: colors.bg,
                              color: colors.color,
                              fontFamily: "inherit",
                              lineHeight: 1.2,
                              overflow: "hidden",
                              boxShadow: `inset 2px 0 0 ${colors.dot}`,
                              "&:hover": {
                                filter: "brightness(0.97)",
                              },
                              "&:focus-visible": {
                                outline: "2px solid #F75F8A",
                                outlineOffset: 0,
                              },
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                display: "block",
                                fontSize: "0.6rem",
                                fontWeight: 700,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {event.title}
                            </Box>
                            <Box
                              component="span"
                              sx={{
                                display: "block",
                                fontSize: "0.55rem",
                                fontWeight: 600,
                                opacity: 0.9,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {clock}
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Always-visible Meeting Details column (~28–32%). */}
          <Box
            component="aside"
            aria-label={t.meetingDetailsAsideAria}
            sx={{
              ...paperSx,
              minWidth: 0,
              p: { xs: 2, md: 2.25 },
            }}
          >
            {selectedEvent ? (
              <MeetingDetailsContent
                event={selectedEvent}
                onClose={closePanel}
                t={t}
                language={language}
                dir={dir}
              />
            ) : (
              <MeetingDetailsEmpty t={t} />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default AdminCalendarPage;
