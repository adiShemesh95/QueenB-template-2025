import { createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: {
      main: "#F75F8A",
      light: "#FF6F91",
      dark: "#E04872",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#8DD8F7",
      light: "#B8E7FA",
      dark: "#5BC4EF",
      contrastText: "#07142D",
    },
    text: {
      primary: "#07142D",
      secondary: "#4A5568",
    },
    background: {
      default: "#F8FBFF",
      paper: "#FFFFFF",
    },
  },
  typography: {
    fontFamily: '"Heebo", "Plus Jakarta Sans", "Helvetica Neue", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#F8FBFF",
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: false,
      },
      styleOverrides: {
        root: {
          "&:focus-visible": {
            outline: "2px solid #F75F8A",
            outlineOffset: "3px",
          },
        },
      },
    },
  },
});

export default theme;
