import React from "react";
import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { FILTER_ALL, STATUS_FILTER_OPTIONS } from "./constants";
import { useMatchingLanguage } from "./MatchingLanguageContext";

function RequestFilters({ value = FILTER_ALL, onChange }) {
  const { t } = useMatchingLanguage();

  return (
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
        value={value}
        onChange={(_event, next) => {
          if (next !== null) onChange(next);
        }}
        aria-label={t.filterAria}
        sx={{
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
        }}
      >
        {STATUS_FILTER_OPTIONS.map((option) => (
          <ToggleButton key={option.value} value={option.value}>
            {t.filters[option.value] || option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}

export default RequestFilters;
