import React, { useEffect, useState } from "react";
import { Box, Typography, CircularProgress, Alert, Stack } from "@mui/material";
import MatchingLayout from "./MatchingLayout";
import RequestFilters from "./RequestFilters";
import RequestCard from "./RequestCard";
import { getRequests } from "./matchingService";
import { FILTER_ALL } from "./constants";
import { useMatchingLanguage } from "./MatchingLanguageContext";

function MyRequestsPage() {
  const { t } = useMatchingLanguage();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState(FILTER_ALL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(false);
        const data = await getRequests();
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

  const filteredRequests =
    filter === FILTER_ALL
      ? requests
      : requests.filter((request) => request.status === filter);

  return (
    <MatchingLayout
      title={t.myRequests}
      subtitle={t.myRequestsSubtitle}
      backTo="/"
      backLabel={t.home}
    >
      <RequestFilters value={filter} onChange={setFilter} />

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

      {!loading && !error && filteredRequests.length === 0 && (
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
            {t.emptyTitle}
          </Typography>
          <Typography sx={{ color: "#6B7280", fontSize: "0.95rem" }}>
            {filter === FILTER_ALL ? t.emptyAll : t.emptyFiltered}
          </Typography>
        </Box>
      )}

      {!loading && !error && filteredRequests.length > 0 && (
        <Stack spacing={1.75}>
          {filteredRequests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </Stack>
      )}
    </MatchingLayout>
  );
}

export default MyRequestsPage;
