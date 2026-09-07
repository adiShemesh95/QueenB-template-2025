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
  ADMIN_STATUS_FILTER_ALL,
  ADMIN_STATUS_FILTER_OPTIONS,
} from "./adminConstants";
import AdminStatusChip from "./AdminStatusChip";
import { formatAdminDateTime, formatAdminTimeRange } from "./adminFormat";

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
  const [matchings, setMatchings] = useState([]);
  const [users, setUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState(ADMIN_STATUS_FILTER_ALL);
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [error, setError] = useState(false);

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
    <Box>
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
        Matchings
      </Typography>
      <Typography sx={{ color: "#4A5568", mb: 3, maxWidth: 640, lineHeight: 1.55 }}>
        Matching report for current production statuses. Filters are applied by
        the Admin backend.
      </Typography>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ mb: 3 }}
        alignItems={{ xs: "stretch", md: "flex-end" }}
      >
        <FormControl size="small" sx={{ minWidth: { xs: "100%", md: 240 } }}>
          <InputLabel id="admin-status-filter-label">Status</InputLabel>
          <Select
            labelId="admin-status-filter-label"
            id="admin-status-filter"
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {ADMIN_STATUS_FILTER_OPTIONS.map((option) => (
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
              label="Participant"
              placeholder="Filter by mentor or mentee"
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
          Reset filters
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
          <Typography sx={{ color: "#4A5568" }}>Loading matchings…</Typography>
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          Could not load matchings. Please try again.
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
            {hasActiveFilters
              ? "No matchings found for the selected filters."
              : "No matchings found"}
          </Typography>
          <Typography sx={{ color: "#6B7280", fontSize: "0.95rem" }}>
            {hasActiveFilters
              ? "Try a different status or participant, or reset the filters."
              : "There are no matching records to display yet."}
          </Typography>
        </Box>
      )}

      {!loading && !error && matchings.length > 0 && (
        <TableContainer sx={paperSx}>
          <Table aria-label="Admin matchings" size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mentor</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mentee</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Selected meeting time</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {matchings.map((matching) => (
                <TableRow key={matching.id} hover>
                  <TableCell>{matching.id}</TableCell>
                  <TableCell>
                    {matching.mentor?.username || "—"}
                  </TableCell>
                  <TableCell>
                    {matching.mentee?.username || "—"}
                  </TableCell>
                  <TableCell>
                    <AdminStatusChip status={matching.status} />
                  </TableCell>
                  <TableCell>
                    {matching.selectedSlot
                      ? formatAdminTimeRange(
                          matching.selectedSlot.start,
                          matching.selectedSlot.end
                        )
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {formatAdminDateTime(matching.createdAt)}
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
                      View details
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
