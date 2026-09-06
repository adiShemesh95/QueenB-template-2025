import React from "react";
import { Box, Typography } from "@mui/material";

function BootcampFooter({ t }) {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "transparent",
        pt: { xs: "8px", sm: "12px" },
        pb: { xs: "32px", sm: "40px" },
        px: 2,
        textAlign: "center",
        direction: "ltr",
      }}
    >
      <Typography
        component="p"
        sx={{
          m: 0,
          mb: "20px",
          color: "#F75F8A",
          fontWeight: 600,
          fontSize: { xs: "15px", sm: "16px", md: "17px" },
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
          gap: { xs: 1.5, sm: 2, md: 2.25 },
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
            height: { xs: 28, sm: 34, md: 36 },
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
            fontSize: { xs: "24px", sm: "28px", md: "30px" },
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
            height: { xs: 34, sm: 40, md: 42 },
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
