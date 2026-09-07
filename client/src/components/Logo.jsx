import React, { useId } from "react";
import { Box, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

/**
 * Queens Match brand mark — crown icon + pink/sky gradient wordmark.
 * Always navigates to /dashboard.
 */
function CrownIcon({ size = 28 }) {
  const gradientId = useId().replace(/:/g, "");

  return (
    <Box
      component="svg"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      sx={{ flexShrink: 0, display: "block" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="4" y1="4" x2="28" y2="28">
          <stop offset="0%" stopColor="#8DD8F7" />
          <stop offset="55%" stopColor="#FF6F91" />
          <stop offset="100%" stopColor="#F75F8A" />
        </linearGradient>
      </defs>
      <path
        d="M6.5 22.5L4 11.5l6.2 4.4L16 7l5.8 8.9L28 11.5l-2.5 11H6.5z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M6.5 22.5h19v2.2c0 .7-.6 1.3-1.3 1.3H7.8c-.7 0-1.3-.6-1.3-1.3v-2.2z"
        fill={`url(#${gradientId})`}
        opacity="0.9"
      />
      <circle cx="4" cy="10.5" r="1.6" fill="#8DD8F7" />
      <circle cx="16" cy="6.2" r="1.8" fill="#FF6F91" />
      <circle cx="28" cy="10.5" r="1.6" fill="#F75F8A" />
    </Box>
  );
}

function Logo({ size = "md" }) {
  const iconSize = size === "sm" ? 24 : 28;
  const fontSize =
    size === "sm"
      ? { xs: "0.95rem", sm: "1.05rem" }
      : { xs: "1.05rem", sm: "1.2rem" };

  return (
    <Box
      component={RouterLink}
      to="/dashboard"
      aria-label="Queens Match — go to dashboard"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        textDecoration: "none",
        minWidth: 0,
        "&:hover .qm-logo-text": {
          filter: "brightness(1.05)",
        },
        "&:focus-visible": {
          outline: "2px solid #F75F8A",
          outlineOffset: 3,
          borderRadius: 1,
        },
      }}
    >
      <CrownIcon size={iconSize} />
      <Typography
        className="qm-logo-text"
        component="span"
        sx={{
          fontWeight: 700,
          fontSize,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          background: "linear-gradient(120deg, #5BC4EF 0%, #F75F8A 55%, #FF6F91 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
          transition: "filter 150ms ease",
          whiteSpace: "nowrap",
        }}
      >
        Queens Match
      </Typography>
    </Box>
  );
}

export default Logo;
export { CrownIcon };
