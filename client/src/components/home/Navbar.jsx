import React from "react";
import { AppBar, Toolbar } from "@mui/material";
import LanguageSelector from "./LanguageSelector";

function Navbar({ language, onLanguageChange, t }) {
  return (
    <AppBar
      position="absolute"
      elevation={0}
      color="transparent"
      sx={{
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "transparent",
        boxShadow: "none",
      }}
    >
      <Toolbar
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 1, sm: 1.25 },
          minHeight: { xs: 56, sm: 64 },
          justifyContent: "flex-end",
          maxWidth: 1200,
          width: "100%",
          mx: "auto",
          // Keep language selector fixed in the top-right.
          direction: "ltr",
        }}
      >
        <LanguageSelector
          language={language}
          onLanguageChange={onLanguageChange}
          ariaLabel={t.languageAria}
        />
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
