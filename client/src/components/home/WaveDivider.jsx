import React from "react";
import { Box } from "@mui/material";

/**
 * Thin dual-layer organic pink wave ribbons (not a solid pink block).
 * High left → center dip → fuller rise on the right.
 * Permanently LTR.
 */
function WaveDivider() {
  return (
    <Box
      component="div"
      aria-hidden="true"
      sx={{
        position: "relative",
        width: "100%",
        lineHeight: 0,
        overflow: "hidden",
        direction: "ltr",
        backgroundColor: "transparent",
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        sx={{
          display: "block",
          width: "100%",
          height: { xs: 72, sm: 96, md: 112 },
        }}
      >
        {/* Softer translucent pink ribbon — sits slightly behind / above */}
        <path
          d="
            M0,48
            C180,28 360,95 560,118
            C780,145 980,120 1160,55
            C1260,28 1360,14 1440,10
            L1440,78
            C1340,72 1240,88 1120,118
            C940,162 760,175 560,155
            C360,135 180,85 0,98
            Z
          "
          fill="rgba(255, 176, 198, 0.55)"
        />

        {/* Main QueenB pink ribbon — thinner left, fuller on the right */}
        <path
          d="
            M0,62
            C200,42 380,108 580,132
            C800,158 1000,130 1180,62
            C1280,32 1370,20 1440,16
            L1440,108
            C1350,95 1260,105 1140,138
            C960,182 780,188 580,168
            C380,148 200,100 0,112
            Z
          "
          fill="#F75F8A"
        />
      </Box>
    </Box>
  );
}

export default WaveDivider;
