import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
import { getAdminUsers } from "./adminService";
import { formatAdminDate } from "./adminFormat";
import { useAdminLanguage } from "./translations";

const paperSx = {
  borderRadius: 3,
  backgroundColor: "rgba(255, 255, 255, 0.88)",
  border: "1px solid rgba(255, 255, 255, 0.95)",
  boxShadow: "0 8px 24px rgba(7, 20, 45, 0.05)",
  overflow: "auto",
};

/**
 * Admin Users list — fields match GET /api/admin/users exactly.
 *
 * matchingCountAsMentor / matchingCountAsMentee currently represent matching
 * records, not confirmed completed mentoring sessions. Completion semantics
 * will be added with the lifecycle stage.
 */
function AdminUsersPage() {
  const { language, dir, t } = useAdminLanguage();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(false);
        const data = await getAdminUsers();
        if (!cancelled) setUsers(data);
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

  // Client-side filter only — trims query and matches username or email (case-insensitive).
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const filteredUsers = trimmedQuery
    ? users.filter((user) => {
        const username = (user.username || "").toLowerCase();
        const email = (user.email || "").toLowerCase();
        return (
          username.includes(trimmedQuery) || email.includes(trimmedQuery)
        );
      })
    : users;

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
        {t.usersTitle}
      </Typography>
      <Typography sx={{ color: "#4A5568", mb: 3, maxWidth: 640, lineHeight: 1.55 }}>
        {t.usersSubtitle}
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
          <Typography sx={{ color: "#4A5568" }}>{t.loadingUsers}</Typography>
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {t.loadUsersError}
        </Alert>
      )}

      {!loading && !error && users.length === 0 && (
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
            {t.noUsersFound}
          </Typography>
          <Typography sx={{ color: "#6B7280", fontSize: "0.95rem" }}>
            {t.noUsersBody}
          </Typography>
        </Box>
      )}

      {!loading && !error && users.length > 0 && (
        <>
          <TextField
            size="small"
            label={t.searchUsers}
            placeholder={t.searchUsersPlaceholder}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            inputProps={{ "aria-label": t.searchUsersAria }}
            sx={{ mb: 3, maxWidth: 420, width: "100%" }}
          />

          {filteredUsers.length === 0 ? (
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
              <Typography sx={{ fontWeight: 600, color: "#07142D" }}>
                {t.noUsersFound}
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={paperSx}>
              <Table aria-label={t.usersTableAria} size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>{t.colUsername}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t.colEmail}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      {t.colMentoringMatchings}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      {t.colMenteeMatchings}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t.colRegistered}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      {t.colActions}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell align="right">
                        {user.matchingCountAsMentor}
                      </TableCell>
                      <TableCell align="right">
                        {user.matchingCountAsMentee}
                      </TableCell>
                      <TableCell>{formatAdminDate(user.createdAt, language)}</TableCell>
                      <TableCell align="right">
                        <Button
                          component={RouterLink}
                          to={`/admin/users/${user.id}`}
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
        </>
      )}
    </Box>
  );
}

export default AdminUsersPage;
