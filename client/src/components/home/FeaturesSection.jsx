import React from "react";
import { Box, Typography } from "@mui/material";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";

const FEATURE_ICONS = {
  mentorship: GroupsOutlinedIcon,
  matching: CalendarMonthOutlinedIcon,
  community: FavoriteBorderOutlinedIcon,
};

function FeaturesSection({ t, textDir = "ltr" }) {
  return (
    <Box
      component="section"
      aria-label={t.featuresAria}
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "flex-start",
        gap: { xs: 3, sm: 3.5, md: 5 },
        px: { xs: 2, sm: 3 },
        pt: { xs: 3, sm: 3.5 },
        pb: { xs: 3, sm: 3.5 },
        maxWidth: 900,
        mx: "auto",
        // Keep feature card order identical in every language.
        direction: "ltr",
      }}
    >
      {t.features.map(({ id, title, subtitle }) => {
        const Icon = FEATURE_ICONS[id];
        return (
          <Box
            key={id}
            sx={{
              flex: { xs: "1 1 100%", sm: "1 1 200px" },
              maxWidth: { xs: 320, sm: 240 },
              mx: "auto",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              direction: "ltr",
            }}
          >
            <Box
              aria-hidden="true"
              sx={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(247, 95, 138, 0.1)",
                color: "#F75F8A",
                mb: 0.25,
              }}
            >
              <Icon sx={{ fontSize: 24 }} />
            </Box>
            <Typography
              component="h2"
              dir={textDir}
              sx={{
                fontSize: { xs: "1.05rem", sm: "1.1rem" },
                fontWeight: 700,
                color: "#07142D",
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </Typography>
            <Typography
              component="p"
              dir={textDir}
              sx={{
                fontSize: "0.925rem",
                color: "#6B7280",
                lineHeight: 1.5,
                fontWeight: 400,
              }}
            >
              {subtitle}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

export default FeaturesSection;
