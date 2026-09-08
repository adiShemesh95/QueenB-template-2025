import React from "react";
import { Box } from "@mui/material";
import WaveDivider from "./home/WaveDivider";
import BootcampBranding from "./home/BootcampFooter";

const bootcampCopy = { bootcamp: "BOOTCAMP 2026" };

/**
 * Shared Bootcamp footer section: pink wave + branding + partner logos.
 * Reuses WaveDivider and home BootcampFooter branding markup.
 */
function BootcampFooter() {
  return (
    <Box
      sx={{
        backgroundColor: "#FBF7F8",
        direction: "ltr",
        mt: { xs: 1, sm: 2 },
      }}
    >
      <WaveDivider />
      <BootcampBranding t={bootcampCopy} />
    </Box>
  );
}

export default BootcampFooter;
