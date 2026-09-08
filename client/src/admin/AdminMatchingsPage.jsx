import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { getAdminMatchings, getAdminUsers } from "./adminService";
import {
  ADMIN_MATCHING_STATUSES,
  ADMIN_STATUS_FILTER_ALL,
} from "./adminConstants";
import AdminStatusChip from "./AdminStatusChip";
import { formatAdminDateTime, formatAdminTimeRange } from "./adminFormat";
import { getAdminUiStatusLabel, useAdminLanguage } from "./translations";

const paperSx = {
  borderRadius: 3,
  backgroundColor: "rgba(255, 255, 255, 0.88)",
  border: "1px solid rgba(255, 255, 255, 0.95)",
  boxShadow: "0 8px 24px rgba(7, 20, 45, 0.05)",
  overflow: "auto",
};

/**
 * Admin Matchings report — GET /api/admin/matchings with backend filters.
 * Status options are only the four current production values.
 */
function AdminMatchingsPage() {
  const { language, dir, t } = useAdminLanguage();
  const [matchings, setMatchings] = useState([]);
  const [users, setUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState(ADMIN_STATUS_FILTER_ALL);
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState(false);

  const statusFilterOptions = useMemo(
    () => [
      { value: ADMIN_STATUS_FILTER_ALL, label: t.statusFilterAll },
      ...ADMIN_MATCHING_STATUSES.map((status) => ({
        value: status,
        label: getAdminUiStatusLabel(status, t),
      })),
    ],
    [t]
  );

  const filters = useMemo(() => {
    const next = {};
    if (statusFilter) next.status = statusFilter;
    if (participant?.id != null) next.participantId = participant.id;
    return next;
  }, [statusFilter, participant]);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      try {
        setUsersLoading(true);
        const data = await getAdminUsers();
        if (!cancelled) setUsers(data);
      } catch (err) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    }

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMatchings() {
      try {
        setLoading(true);
        setError(false);
        const data = await getAdminMatchings(filters);
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
  }, [filters]);

  const hasActiveFilters = Boolean(statusFilter) || participant != null;

  const resetFilters = () => {
    setStatusFilter(ADMIN_STATUS_FILTER_ALL);
    setParticipant(null);
  };

  return (
    <Box dir={dir} lang={language}>
      <Typography
        component="h1"
        sx={{
          fontSize: { xs: "1.75rem", sm: "2rem" },
          fontWeight: 700,
          color: "#07142D",
          letterSpacing: "-0.02em",
          mb: 0.75,
        }}
      >
        {t.matchingsTitle}
      </Typography>
      <Typography sx={{ color: "#4A5568", mb: 3, maxWidth: 640, lineHeight: 1.55 }}>
        {t.matchingsSubtitle}
      </Typography>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ mb: 3 }}
        alignItems={{ xs: "stretch", md: "flex-end" }}
      >
        <FormControl size="small" sx={{ minWidth: { xs: "100%", md: 240 } }}>
          <InputLabel id="admin-status-filter-label">{t.statusLabel}</InputLabel>
          <Select
            labelId="admin-status-filter-label"
            id="admin-status-filter"
            label={t.statusLabel}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {statusFilterOptions.map((option) => (
              <MenuItem key={option.value || "all"} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Autocomplete
          size="small"
          sx={{ minWidth: { xs: "100%", md: 280 }, flex: 1 }}
          options={users}
          loading={usersLoading}
          value={participant}
          onChange={(_event, value) => setParticipant(value)}
          getOptionLabel={(option) =>
            option
              ? `${option.username} (${option.email})`
              : ""
          }
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t.participantLabel}
              placeholder={t.participantPlaceholder}
            />
          )}
        />

        <Button
          onClick={resetFilters}
          disabled={!hasActiveFilters}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            color: "#4A5568",
            alignSelf: { xs: "stretch", md: "center" },
          }}
        >
          {t.resetFilters}
        </Button>
      </Stack>

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
          <Typography sx={{ color: "#4A5568" }}>{t.loadingMatchings}</Typography>
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {t.loadMatchingsError}
        </Alert>
      )}

      {!loading && !error && matchings.length === 0 && (
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
            {hasActiveFilters ? t.noMatchingsFiltered : t.noMatchingsFound}
          </Typography>
          <Typography sx={{ color: "#6B7280", fontSize: "0.95rem" }}>
            {hasActiveFilters ? t.noMatchingsFilteredBody : t.noMatchingsBody}
          </Typography>
        </Box>
      )}

      {!loading && !error && matchings.length > 0 && (
        <TableContainer sx={paperSx}>
          <Table aria-label={t.matchingsTableAria} size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>{t.colId}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t.colMentor}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t.colMentee}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t.colStatus}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t.colSelectedMeetingTime}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t.colCreated}</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  {t.colActions}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {matchings.map((matching) => (
                <TableRow key={matching.id} hover>
                  <TableCell>{matching.id}</TableCell>
                  <TableCell>
                    {matching.mentor?.username || t.emDash}
                  </TableCell>
                  <TableCell>
                    {matching.mentee?.username || t.emDash}
                  </TableCell>
                  <TableCell>
                    <AdminStatusChip status={matching.status} />
                  </TableCell>
                  <TableCell>
                    {matching.selectedSlot
                      ? formatAdminTimeRange(
                          matching.selectedSlot.start,
                          matching.selectedSlot.end,
                          language
                        )
                      : t.emDash}
                  </TableCell>
                  <TableCell>
                    {formatAdminDateTime(matching.createdAt, language)}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      component={RouterLink}
                      to={`/admin/matchings/${matching.id}`}
                      size="small"
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        color: "#F75F8A",
                      }}
                    >
                      {t.viewDetails}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default AdminMatchingsPage;
