import React from "react";
import { Box, Typography } from "@mui/material";

function BootcampFooter({ t }) {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "transparent",
        pt: { xs: "4px", sm: "8px" },
        pb: { xs: "20px", sm: "28px" },
        px: 2,
        textAlign: "center",
        direction: "ltr",
      }}
    >
      <Typography
        component="p"
        sx={{
          m: 0,
          mb: "14px",
          color: "#F75F8A",
          fontWeight: 600,
          fontSize: { xs: "13px", sm: "14px", md: "15px" },
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          direction: "ltr",
        }}
      >
        {t.bootcamp}
      </Typography>

      <Box
        className="footer-logos"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "nowrap",
          gap: { xs: 1.25, sm: 1.75, md: 2 },
          direction: "ltr",
          maxWidth: "100%",
          transform: "none",
          filter: "none",
          unicodeBidi: "normal",
          writingMode: "horizontal-tb",
        }}
      >
        <Box
          component="img"
          src="/assets/appsflyer-logo.svg"
          alt="AppsFlyer"
          className="footer-logo appsflyer-logo"
          sx={{
            display: "block",
            height: { xs: 22, sm: 26, md: 28 },
            width: "auto",
            objectFit: "contain",
            flexShrink: 0,
            transform: "none",
            filter: "none",
            direction: "ltr",
          }}
        />
        <Typography
          component="span"
          className="collaboration-x"
          aria-hidden="true"
          sx={{
            color: "#07142D",
            fontWeight: 500,
            fontSize: { xs: "18px", sm: "22px", md: "24px" },
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            direction: "ltr",
            transform: "none",
          }}
        >
          ×
        </Typography>
        <Box
          component="img"
          src="/assets/queenb-logo.svg"
          alt="QueenB"
          className="footer-logo queenb-logo"
          sx={{
            display: "block",
            height: { xs: 26, sm: 32, md: 34 },
            width: "auto",
            objectFit: "contain",
            flexShrink: 0,
            transform: "none",
            filter: "none",
            direction: "ltr",
          }}
        />
      </Box>
    </Box>
  );
}

export default BootcampFooter;
