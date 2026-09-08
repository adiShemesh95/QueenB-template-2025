import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useMatchingLanguage } from "../../matching/MatchingLanguageContext";
import BootcampFooter from "../BootcampFooter";
import LanguageSelector from "../home/LanguageSelector";
import translations from "./translations";
import { getSafeReturnPath } from "./returnPath";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emptyFieldErrors() {
  return {
    email: "",
    password: "",
  };
}

function validateSignIn({ email, password }, t) {
  const errors = emptyFieldErrors();

  if (!email) {
    errors.email = t.emailRequired;
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = t.emailInvalid;
  }

  if (!password) {
    errors.password = t.passwordRequired;
  }

  return errors;
}

function hasFieldErrors(errors) {
  return Object.values(errors).some(Boolean);
}

/** Safe Admin return path from router state (Admin entry flow only). */
function getAdminReturnPath(from) {
  if (typeof from === "string" && from.startsWith("/admin")) {
    return from;
  }
  return "/admin";
}

function SignInPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const adminIntent = location.state?.adminIntent === true;
  const { language, setLanguage, dir } = useMatchingLanguage();
  const t = translations[language] || translations.en;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState(emptyFieldErrors());
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setGeneralError("");

    const trimmedEmail = email.trim();
    const nextErrors = validateSignIn(
      {
        email: trimmedEmail,
        password,
      },
      t
    );

    setFieldErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) {
      return;
    }

    setSubmitting(true);
    try {
      const data = await login({
        email: trimmedEmail,
        password,
      });
      setPassword("");

      // Admin entry (/admin → login) preserves intent via location.state.
      // GuestRoute also honors adminIntent when login() setUser() re-renders
      // the /login guard — both must agree so /dashboard cannot win the race.
      if (adminIntent) {
        if (data?.user?.isAdmin === true) {
          navigate(getAdminReturnPath(location.state?.from), { replace: true });
        } else {
          // Land on /admin so AdminRoute can show "Admin access required"
          // without treating this as a normal-user dashboard login.
          navigate("/admin", { replace: true });
        }
      } else {
        const returnTo = getSafeReturnPath(location.state?.from);
        navigate(returnTo || "/dashboard", { replace: true });
      }
    } catch (err) {
      const apiError = err?.response?.data?.error;
      const code = apiError?.code;
      const details = Array.isArray(apiError?.details) ? apiError.details : [];

      if (code === "VALIDATION_ERROR") {
        const mapped = emptyFieldErrors();
        details.forEach((detail) => {
          if (detail?.field && detail.field in mapped && detail.message) {
            mapped[detail.field] = detail.message;
          }
        });
        if (hasFieldErrors(mapped)) {
          setFieldErrors(mapped);
        } else {
          setGeneralError(apiError?.message || t.fixHighlightedFields);
        }
      } else if (code === "INVALID_CREDENTIALS") {
        setGeneralError(apiError?.message || t.invalidCredentials);
      } else {
        setGeneralError(t.signInUnavailable);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        background:
          "linear-gradient(160deg, #EAF7FD 0%, #F9FBFF 45%, #FDF2F6 100%)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 2,
          direction: "ltr",
        }}
      >
        <LanguageSelector
          language={language}
          onLanguageChange={setLanguage}
          ariaLabel={t.languageAria}
        />
      </Box>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          px: 3,
          py: 4,
        }}
      >
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        dir={dir}
        lang={language}
        sx={{
          width: "100%",
          maxWidth: 420,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          boxShadow: "0 12px 40px rgba(7, 20, 45, 0.08)",
          border: "1px solid rgba(247, 95, 138, 0.12)",
          direction: dir,
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "#07142D",
            textAlign: "center",
          }}
        >
          {t.signInTitle}
        </Typography>

        <Typography
          sx={{ color: "#6B7280", textAlign: "center", mt: -0.5, mb: 0.5 }}
        >
          {adminIntent ? t.signInAdminSubtitle : t.signInSubtitle}
        </Typography>

        {generalError ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {generalError}
          </Alert>
        ) : null}

        <TextField
          id="signin-email"
          name="email"
          label={t.email}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={Boolean(fieldErrors.email)}
          helperText={fieldErrors.email || " "}
          disabled={submitting}
          fullWidth
          required
        />

        <TextField
          id="signin-password"
          name="password"
          label={t.password}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={Boolean(fieldErrors.password)}
          helperText={fieldErrors.password || " "}
          disabled={submitting}
          fullWidth
          required
        />

        <Button
          type="submit"
          variant="contained"
          disabled={submitting}
          fullWidth
          sx={{
            mt: 0.5,
            py: 1.35,
            borderRadius: 3,
            background: "linear-gradient(135deg, #FF6F91, #F75F8A)",
            boxShadow: "0 8px 20px rgba(247, 95, 138, 0.25)",
            "&:hover": {
              background: "linear-gradient(135deg, #FF7A9A, #F75F8A)",
            },
          }}
        >
          {submitting ? (
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={18} color="inherit" />
              {t.signingIn}
            </Box>
          ) : (
            t.signIn
          )}
        </Button>

        {/* Public Sign Up is for normal users only — Admin is isAdmin capability, not self-registration. */}
        {!adminIntent ? (
          <Typography sx={{ textAlign: "center", color: "#6B7280", mt: 0.5 }}>
            {t.noAccount}{" "}
            <Link
              component={RouterLink}
              to="/register"
              underline="hover"
              sx={{ color: "#F75F8A", fontWeight: 600 }}
            >
              {t.signUpLink}
            </Link>
          </Typography>
        ) : null}

        <Button
          component={RouterLink}
          to="/"
          variant="text"
          disabled={submitting}
          sx={{ color: "#4A5568" }}
        >
          {t.backHome}
        </Button>
      </Box>
      </Box>
      <BootcampFooter />
    </Box>
  );
}

export default SignInPage;
