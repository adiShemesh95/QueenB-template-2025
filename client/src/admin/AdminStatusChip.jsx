import React from "react";
import { Chip } from "@mui/material";
import { getAdminStatusColors } from "./adminConstants";
import { getAdminUiStatusLabel, useAdminLanguage } from "./translations";

function AdminStatusChip({ status }) {
  const { t } = useAdminLanguage();
  const colors = getAdminStatusColors(status);

  return (
    <Chip
      label={getAdminUiStatusLabel(status, t)}
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
