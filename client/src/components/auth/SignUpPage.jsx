import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  LinearProgress,
  TextField,
  Typography,
} from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useMatchingLanguage } from "../../matching/MatchingLanguageContext";
import BootcampFooter from "../BootcampFooter";
import LanguageSelector from "../home/LanguageSelector";
import translations from "./translations";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const MAX_PASSWORD_BYTES = 72;

function utf8ByteLength(value) {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).length;
  }
  // Fallback for environments without TextEncoder (e.g. older jsdom).
  return unescape(encodeURIComponent(value)).length;
}

// Live checklist + strength use these same rules as backend registration validation.
// Backend remains the source of truth; this is UX feedback only.
function getPasswordRequirements(password, t) {
  const value = typeof password === "string" ? password : "";
  return [
    {
      id: "minLength",
      label: t.reqMinLength,
      met: value.length >= 8,
    },
    {
      id: "uppercase",
      label: t.reqUpper,
      met: /[A-Z]/.test(value),
    },
    {
      id: "lowercase",
      label: t.reqLower,
      met: /[a-z]/.test(value),
    },
    {
      id: "number",
      label: t.reqNumber,
      met: /[0-9]/.test(value),
    },
    {
      id: "special",
      label: t.reqSpecial,
      met: /[^A-Za-z0-9]/.test(value),
    },
    {
      id: "maxBytes",
      // Kept for strength/"Strong password" and submit validation — hidden from the
      // checklist so users are not shown technical UTF-8 byte details.
      label: t.reqMaxBytes,
      met: utf8ByteLength(value) <= MAX_PASSWORD_BYTES,
      visible: false,
    },
  ];
}

// Live username rules mirror backend (3–50 chars; letters/numbers/underscore only).
// Availability (USERNAME_TAKEN) can only be confirmed by the backend/database.
function getUsernameRequirements(username, t) {
  const value = typeof username === "string" ? username : "";
  return [
    {
      id: "length",
      label: t.reqUsernameLength,
      met: value.length >= 3 && value.length <= 50,
    },
    {
      id: "chars",
      label: t.reqUsernameChars,
      met: value.length > 0 && USERNAME_REGEX.test(value),
    },
  ];
}

// Live email format check uses the same regex as submit/backend — no extra restrictions.
// Whether the email is already taken (EMAIL_TAKEN) is confirmed only by the backend.
function getEmailRequirements(email, t) {
  const value = typeof email === "string" ? email.trim() : "";
  return [
    {
      id: "format",
      label: t.reqEmailFormat,
      met: value.length > 0 && EMAIL_REGEX.test(value),
    },
  ];
}

// Strength is derived only from how many of the existing requirements are met
// (including the hidden 72-byte rule). "Strong password" only when every rule passes.
function getPasswordStrength(requirements, t) {
  const metCount = requirements.filter((item) => item.met).length;
  const total = requirements.length;

  if (metCount === total) {
    return { level: "strong", label: t.strengthStrong, progress: 100 };
  }
  if (metCount >= 3) {
    return {
      level: "medium",
      label: t.strengthMedium,
      progress: Math.round((metCount / total) * 100),
    };
  }
  return {
    level: "weak",
    label: t.strengthWeak,
    progress: Math.round((metCount / total) * 100),
  };
}

const STRENGTH_COLORS = {
  weak: "#F75F8A",
  medium: "#E8A838",
  strong: "#2E9E6B",
};

const liveFeedbackPanelSx = {
  mt: -1,
  mb: 0.5,
  px: 1.5,
  py: 1.25,
  borderRadius: 2,
  backgroundColor: "rgba(247, 95, 138, 0.04)",
  border: "1px solid rgba(247, 95, 138, 0.1)",
};

function RequirementRows({ items, testIdPrefix }) {
  return (
    <Box
      component="ul"
      sx={{
        m: 0,
        p: 0,
        listStyle: "none",
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
      }}
    >
      {items.map((item) => (
        <Box
          component="li"
          key={item.id}
          data-testid={`${testIdPrefix}-${item.id}`}
          data-met={item.met ? "true" : "false"}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            color: item.met ? "#2E9E6B" : "#9CA3AF",
          }}
        >
          {item.met ? (
            <CheckRoundedIcon sx={{ fontSize: 16 }} aria-hidden />
          ) : (
            <RadioButtonUncheckedIcon sx={{ fontSize: 14 }} aria-hidden />
          )}
          <Typography
            component="span"
            sx={{
              fontSize: "0.78rem",
              lineHeight: 1.35,
              color: "inherit",
            }}
          >
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

// Checklist updates while typing so users see progress without red errors on every keystroke.
function PasswordRequirementsChecklist({ password, t }) {
  const requirements = getPasswordRequirements(password, t);
  const visibleRequirements = requirements.filter((item) => item.visible !== false);
  const strength = getPasswordStrength(requirements, t);
  const strengthColor = STRENGTH_COLORS[strength.level];

  return (
    <Box data-testid="password-requirements" sx={liveFeedbackPanelSx}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 0.75,
        }}
      >
        <Typography
          component="p"
          data-testid="password-strength-label"
          sx={{
            m: 0,
            fontSize: "0.8rem",
            fontWeight: 600,
            color: strengthColor,
          }}
        >
          {strength.level === "strong" ? (
            <Box
              component="span"
              sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}
            >
              <CheckRoundedIcon sx={{ fontSize: 16 }} aria-hidden />
              {strength.label}
            </Box>
          ) : (
            strength.label
          )}
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={Math.max(strength.progress, password ? 8 : 0)}
        aria-label={t.passwordStrengthAria(strength.label)}
        sx={{
          height: 6,
          borderRadius: 3,
          mb: 1.25,
          backgroundColor: "rgba(7, 20, 45, 0.08)",
          "& .MuiLinearProgress-bar": {
            borderRadius: 3,
            backgroundColor: strengthColor,
          },
        }}
      />

      <RequirementRows items={visibleRequirements} testIdPrefix="password-requirement" />
    </Box>
  );
}

function UsernameRequirementsChecklist({ username, t }) {
  const requirements = getUsernameRequirements(username, t);

  return (
    <Box data-testid="username-requirements" sx={liveFeedbackPanelSx}>
      <RequirementRows items={requirements} testIdPrefix="username-requirement" />
    </Box>
  );
}

function EmailRequirementsChecklist({ email, t }) {
  const requirements = getEmailRequirements(email, t);

  return (
    <Box data-testid="email-requirements" sx={liveFeedbackPanelSx}>
      <RequirementRows items={requirements} testIdPrefix="email-requirement" />
    </Box>
  );
}

function emptyFieldErrors() {
  return {
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  };
}

function validateSignUp({ email, username, password, confirmPassword }, t) {
  const errors = emptyFieldErrors();

  if (!email) {
    errors.email = t.emailRequired;
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = t.emailInvalid;
  }

  if (!username) {
    errors.username = t.usernameRequired;
  } else if (username.length < 3 || username.length > 50) {
    errors.username = t.usernameLength;
  } else if (!USERNAME_REGEX.test(username)) {
    errors.username = t.usernameChars;
  }

  // Same password rules as the backend, checked here only so the user gets
  // immediate feedback before we send the registration request.
  if (!password) {
    errors.password = t.passwordRequired;
  } else if (password.length < 8) {
    errors.password = t.passwordMinLength;
  } else if (utf8ByteLength(password) > MAX_PASSWORD_BYTES) {
    errors.password = t.passwordTooLong;
  } else if (!/[A-Z]/.test(password)) {
    errors.password = t.passwordUpper;
  } else if (!/[a-z]/.test(password)) {
    errors.password = t.passwordLower;
  } else if (!/[0-9]/.test(password)) {
    errors.password = t.passwordNumber;
  } else if (!/[^A-Za-z0-9]/.test(password)) {
    errors.password = t.passwordSpecial;
  }

  if (!confirmPassword) {
    errors.confirmPassword = t.confirmRequired;
  } else if (confirmPassword !== password) {
    errors.confirmPassword = t.passwordsMismatch;
  }

  return errors;
}

function hasFieldErrors(errors) {
  return Object.values(errors).some(Boolean);
}

function SignUpPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { language, setLanguage, dir } = useMatchingLanguage();
  const t = translations[language] || translations.en;

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(emptyFieldErrors());
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Show live checklists while typing or focused so requirements are visible without submit-time red errors.
  const showEmailChecklist = emailFocused || email.length > 0;
  const showUsernameChecklist = usernameFocused || username.length > 0;
  const showPasswordChecklist = passwordFocused || password.length > 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setGeneralError("");

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();
    const nextErrors = validateSignUp(
      {
        email: trimmedEmail,
        username: trimmedUsername,
        password,
        confirmPassword,
      },
      t
    );

    setFieldErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) {
      return;
    }

    setSubmitting(true);
    try {
      await register({
        email: trimmedEmail,
        username: trimmedUsername,
        password,
        confirmPassword,
      });
      setPassword("");
      setConfirmPassword("");
      navigate("/dashboard");
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
      } else if (code === "EMAIL_TAKEN") {
        setFieldErrors({
          ...emptyFieldErrors(),
          email: apiError?.message || t.emailTaken,
        });
      } else if (code === "USERNAME_TAKEN") {
        setFieldErrors({
          ...emptyFieldErrors(),
          username: apiError?.message || t.usernameTaken,
        });
      } else {
        setGeneralError(t.signUpUnavailable);
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
          {t.signUpTitle}
        </Typography>

        <Typography
          sx={{ color: "#6B7280", textAlign: "center", mt: -0.5, mb: 0.5 }}
        >
          {t.signUpSubtitle}
        </Typography>

        {generalError ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {generalError}
          </Alert>
        ) : null}

        <TextField
          id="signup-email"
          name="email"
          label={t.email}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) {
              setFieldErrors((prev) => ({ ...prev, email: "" }));
            }
          }}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
          error={Boolean(fieldErrors.email)}
          helperText={fieldErrors.email || " "}
          disabled={submitting}
          fullWidth
          required
        />

        {showEmailChecklist ? (
          <EmailRequirementsChecklist email={email} t={t} />
        ) : null}

        <TextField
          id="signup-username"
          name="username"
          label={t.username}
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (fieldErrors.username) {
              setFieldErrors((prev) => ({ ...prev, username: "" }));
            }
          }}
          onFocus={() => setUsernameFocused(true)}
          onBlur={() => setUsernameFocused(false)}
          error={Boolean(fieldErrors.username)}
          helperText={fieldErrors.username || " "}
          disabled={submitting}
          fullWidth
          required
        />

        {showUsernameChecklist ? (
          <UsernameRequirementsChecklist username={username} t={t} />
        ) : null}

        <TextField
          id="signup-password"
          name="password"
          label={t.password}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            // Clear a previous submit error so the live checklist guides the user instead.
            if (fieldErrors.password) {
              setFieldErrors((prev) => ({ ...prev, password: "" }));
            }
          }}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
          error={Boolean(fieldErrors.password)}
          helperText={fieldErrors.password || " "}
          disabled={submitting}
          fullWidth
          required
        />

        {showPasswordChecklist ? (
          <PasswordRequirementsChecklist password={password} t={t} />
        ) : null}

        <TextField
          id="signup-confirm-password"
          name="confirmPassword"
          label={t.confirmPassword}
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={Boolean(fieldErrors.confirmPassword)}
          helperText={fieldErrors.confirmPassword || " "}
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
              {t.creatingAccount}
            </Box>
          ) : (
            t.signUp
          )}
        </Button>

        <Typography sx={{ textAlign: "center", color: "#6B7280", mt: 0.5 }}>
          {t.hasAccount}{" "}
          <Link
            component={RouterLink}
            to="/login"
            underline="hover"
            sx={{ color: "#F75F8A", fontWeight: 600 }}
          >
            {t.logInLink}
          </Link>
        </Typography>

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

export default SignUpPage;
