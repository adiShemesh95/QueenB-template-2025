import React from "react";
import { Chip } from "@mui/material";
import { getAdminStatusColors, getAdminStatusLabel } from "./adminConstants";

function AdminStatusChip({ status }) {
  const colors = getAdminStatusColors(status);

  return (
    <Chip
      label={getAdminStatusLabel(status)}
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

export default AdminStatusChip;
