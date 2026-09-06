import React from "react";
import { Box, Typography } from "@mui/material";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";

function QuoteSection({ t, textDir = "ltr" }) {
  return (
    <Box
      component="section"
      aria-label={t.quoteAria}
      sx={{
        px: { xs: 2, sm: 3 },
        pt: { xs: 1, sm: 1.5 },
        pb: { xs: 3, sm: 4 },
        display: "flex",
        justifyContent: "center",
        direction: "ltr",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 640,
          px: { xs: 3, sm: 5 },
          py: { xs: 3, sm: 3.75 },
          borderRadius: { xs: "24px", sm: "28px" },
          backgroundColor: "rgba(255, 255, 255, 0.65)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 12px 40px rgba(7, 20, 45, 0.06)",
          border: "1px solid rgba(255, 255, 255, 0.8)",
          textAlign: "center",
          direction: "ltr",
        }}
      >
        <FormatQuoteRoundedIcon
          aria-hidden="true"
          sx={{
            fontSize: 40,
            color: "#F75F8A",
            opacity: 0.9,
            mb: 1,
            transform: "scaleX(-1)",
          }}
        />
        <Typography
          component="blockquote"
          dir={textDir}
          sx={{
            m: 0,
            fontSize: { xs: "1.15rem", sm: "1.4rem" },
            fontWeight: 500,
            lineHeight: 1.55,
            color: "#07142D",
            letterSpacing: "-0.01em",
          }}
        >
          “{t.quoteBefore}
          <br />
          <Box component="span" sx={{ color: "#F75F8A", fontWeight: 700 }}>
            {t.quoteTogether}
          </Box>{" "}
          {t.quoteAfter}”
        </Typography>
        <Typography
          component="cite"
          dir={textDir}
          sx={{
            display: "block",
            mt: 2,
            fontStyle: "normal",
            fontSize: "0.95rem",
            color: "#6B7280",
            fontWeight: 500,
          }}
        >
          {t.quoteAuthor}
        </Typography>
      </Box>
    </Box>
  );
}

export default QuoteSection;
