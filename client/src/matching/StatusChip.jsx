import React from "react";
import { Chip } from "@mui/material";
import { STATUS_COLORS, STATUS_LABELS } from "./constants";
import { useMatchingLanguage } from "./MatchingLanguageContext";

function StatusChip({ status }) {
  const { t } = useMatchingLanguage();
  const colors = STATUS_COLORS[status] || STATUS_COLORS.REJECTED;
  const label = t.filters?.[status] || STATUS_LABELS[status] || status;

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        fontWeight: 600,
        fontSize: "0.75rem",
        height: 26,
        backgroundColor: colors.bg,
        color: colors.color,
        borderRadius: "999px",
      }}
    />
  );
}

export default StatusChip;
