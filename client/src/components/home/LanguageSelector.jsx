import React, { useState } from "react";
import {
  Button,
  Menu,
  MenuItem,
  ListItemText,
  Box,
} from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "he", label: "עברית" },
];

function LanguageSelector({
  language = "en",
  onLanguageChange,
  ariaLabel = "Select language",
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const current =
    LANGUAGES.find((lang) => lang.code === language) || LANGUAGES[0];

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (code) => {
    onLanguageChange?.(code);
    handleClose();
  };

  return (
    <Box>
      <Button
        id="language-selector-button"
        aria-controls={open ? "language-selector-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        aria-label={ariaLabel}
        onClick={handleOpen}
        startIcon={<LanguageIcon sx={{ fontSize: 20 }} />}
        endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 18 }} />}
        sx={{
          color: "text.primary",
          fontWeight: 500,
          fontSize: "0.95rem",
          px: 1.5,
          py: 0.75,
          borderRadius: 2,
          backgroundColor: "transparent",
          direction: "ltr",
          "& .MuiButton-startIcon": { marginRight: 1, marginLeft: 0 },
          "& .MuiButton-endIcon": { marginLeft: 1, marginRight: 0 },
          "&:hover": {
            backgroundColor: "rgba(247, 95, 138, 0.06)",
          },
        }}
      >
        {current.label}
      </Button>
      <Menu
        id="language-selector-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{ "aria-labelledby": "language-selector-button" }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: 2,
              minWidth: 140,
              boxShadow: "0 8px 24px rgba(7, 20, 45, 0.08)",
            },
          },
        }}
      >
        {LANGUAGES.map((lang) => (
          <MenuItem
            key={lang.code}
            selected={lang.code === language}
            onClick={() => handleSelect(lang.code)}
          >
            <ListItemText primary={lang.label} />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

export default LanguageSelector;
