import React from "react";
import { Chip } from "@mui/material";
import {
  ADMIN_STATUS_COLORS,
  getAdminStatusLabel,
} from "./adminConstants";

function AdminStatusChip({ status }) {
  const colors = ADMIN_STATUS_COLORS[status] || ADMIN_STATUS_COLORS.REJECTED;

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
