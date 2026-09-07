import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import MentorLayout from "./MentorLayout";
import MentorCard from "./MentorCard";
import { getMentors } from "./mentorService";

function MentorsDirectoryPage() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(false);
        const data = await getMentors();
        if (!cancelled) setMentors(data);
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

  return (
    <MentorLayout
      title="Find a mentor"
      subtitle="Browse active mentors and request a session that fits your goals."
      backTo="/"
      backLabel="Home"
      actions={
        <Button
          component={RouterLink}
          to="/become-mentor"
          variant="outlined"
          sx={{
            px: 2.5,
            py: 1.1,
            borderRadius: 3,
            borderWidth: 1.5,
            borderColor: "#F75F8A",
            color: "#F75F8A",
            fontWeight: 600,
            "&:hover": {
              borderWidth: 1.5,
              borderColor: "#E04872",
              backgroundColor: "rgba(247, 95, 138, 0.06)",
            },
          }}
        >
          Become a mentor
        </Button>
      }
    >
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
          <Typography sx={{ color: "#4A5568" }}>Loading mentors…</Typography>
        </Box>
      )}

      {!loading && error && (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          Unable to load mentors right now. Please try again.
        </Alert>
      )}

      {!loading && !error && mentors.length === 0 && (
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
            No mentors yet
          </Typography>
          <Typography sx={{ color: "#6B7280", fontSize: "0.95rem", mb: 2 }}>
            Be the first to create a mentor profile for the community.
          </Typography>
          <Button
            component={RouterLink}
            to="/become-mentor"
            variant="contained"
            sx={{
              px: 2.75,
              py: 1.2,
              borderRadius: 3,
              background: "linear-gradient(135deg, #FF6F91, #F75F8A)",
              boxShadow: "0 8px 20px rgba(247, 95, 138, 0.22)",
            }}
          >
            Become a mentor
          </Button>
        </Box>
      )}

      {!loading && !error && mentors.length > 0 && (
        <Grid container spacing={2}>
          {mentors.map((mentor) => (
            <Grid item xs={12} sm={6} key={mentor.id}>
              <MentorCard mentor={mentor} />
            </Grid>
          ))}
        </Grid>
      )}
    </MentorLayout>
  );
}

export default MentorsDirectoryPage;
