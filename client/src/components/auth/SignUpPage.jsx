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
function getPasswordRequirements(password) {
  const value = typeof password === "string" ? password : "";
  return [
    {
      id: "minLength",
      label: "At least 8 characters",
      met: value.length >= 8,
    },
    {
      id: "uppercase",
      label: "At least one uppercase letter (A-Z)",
      met: /[A-Z]/.test(value),
    },
    {
      id: "lowercase",
      label: "At least one lowercase letter (a-z)",
      met: /[a-z]/.test(value),
    },
    {
      id: "number",
      label: "At least one number (0-9)",
      met: /[0-9]/.test(value),
    },
    {
      id: "special",
      label: "At least one special character",
      met: /[^A-Za-z0-9]/.test(value),
    },
    {
      id: "maxBytes",
      // Kept for strength/"Strong password" and submit validation — hidden from the
      // checklist so users are not shown technical UTF-8 byte details.
      label: "Within 72 UTF-8 byte maximum",
      met: utf8ByteLength(value) <= MAX_PASSWORD_BYTES,
      visible: false,
    },
  ];
}

// Live username rules mirror backend (3–50 chars; letters/numbers/underscore only).
// Availability (USERNAME_TAKEN) can only be confirmed by the backend/database.
function getUsernameRequirements(username) {
  const value = typeof username === "string" ? username : "";
  return [
    {
      id: "length",
      label: "3 to 50 characters",
      met: value.length >= 3 && value.length <= 50,
    },
    {
      id: "chars",
      label: "Only letters, numbers, and underscore",
      met: value.length > 0 && USERNAME_REGEX.test(value),
    },
  ];
}

// Live email format check uses the same regex as submit/backend — no extra restrictions.
// Whether the email is already taken (EMAIL_TAKEN) is confirmed only by the backend.
function getEmailRequirements(email) {
  const value = typeof email === "string" ? email.trim() : "";
  return [
    {
      id: "format",
      label: "Valid email format",
      met: value.length > 0 && EMAIL_REGEX.test(value),
    },
  ];
}

// Strength is derived only from how many of the existing requirements are met
// (including the hidden 72-byte rule). "Strong password" only when every rule passes.
function getPasswordStrength(requirements) {
  const metCount = requirements.filter((item) => item.met).length;
  const total = requirements.length;

  if (metCount === total) {
    return { level: "strong", label: "Strong password", progress: 100 };
  }
  if (metCount >= 3) {
    return {
      level: "medium",
      label: "Medium",
      progress: Math.round((metCount / total) * 100),
    };
  }
  return {
    level: "weak",
    label: "Weak",
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
function PasswordRequirementsChecklist({ password }) {
  const requirements = getPasswordRequirements(password);
  const visibleRequirements = requirements.filter((item) => item.visible !== false);
  const strength = getPasswordStrength(requirements);
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
        aria-label={`Password strength: ${strength.label}`}
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

function UsernameRequirementsChecklist({ username }) {
  const requirements = getUsernameRequirements(username);

  return (
    <Box data-testid="username-requirements" sx={liveFeedbackPanelSx}>
      <RequirementRows items={requirements} testIdPrefix="username-requirement" />
    </Box>
  );
}

function EmailRequirementsChecklist({ email }) {
  const requirements = getEmailRequirements(email);

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

function validateSignUp({ email, username, password, confirmPassword }) {
  const errors = emptyFieldErrors();

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!username) {
    errors.username = "Username is required.";
  } else if (username.length < 3 || username.length > 50) {
    errors.username = "Username must be between 3 and 50 characters.";
  } else if (!USERNAME_REGEX.test(username)) {
    errors.username = "Username may only contain letters, numbers, and underscores.";
  }

  // Same password rules as the backend, checked here only so the user gets
  // immediate feedback before we send the registration request.
  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (utf8ByteLength(password) > MAX_PASSWORD_BYTES) {
    errors.password = "Password is too long.";
  } else if (!/[A-Z]/.test(password)) {
    errors.password = "Password must include at least one uppercase letter.";
  } else if (!/[a-z]/.test(password)) {
    errors.password = "Password must include at least one lowercase letter.";
  } else if (!/[0-9]/.test(password)) {
    errors.password = "Password must include at least one number.";
  } else if (!/[^A-Za-z0-9]/.test(password)) {
    errors.password = "Password must include at least one special character.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (confirmPassword !== password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

function hasFieldErrors(errors) {
  return Object.values(errors).some(Boolean);
}

function SignUpPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

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
    const nextErrors = validateSignUp({
      email: trimmedEmail,
      username: trimmedUsername,
      password,
      confirmPassword,
    });

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
          setGeneralError(
            apiError?.message || "Please fix the highlighted fields."
          );
        }
      } else if (code === "EMAIL_TAKEN") {
        setFieldErrors({
          ...emptyFieldErrors(),
          email: apiError?.message || "An account with this email already exists.",
        });
      } else if (code === "USERNAME_TAKEN") {
        setFieldErrors({
          ...emptyFieldErrors(),
          username: apiError?.message || "This username is already taken.",
        });
      } else {
        setGeneralError(
          "Unable to create your account right now. Please try again."
        );
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
        alignItems: "center",
        justifyContent: "center",
        px: 3,
        py: 4,
        background:
          "linear-gradient(160deg, #EAF7FD 0%, #F9FBFF 45%, #FDF2F6 100%)",
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
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
          Sign Up
        </Typography>

        <Typography
          sx={{ color: "#6B7280", textAlign: "center", mt: -0.5, mb: 0.5 }}
        >
          Create your Queens Match account
        </Typography>

        {generalError ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {generalError}
          </Alert>
        ) : null}

        <TextField
          id="signup-email"
          name="email"
          label="Email"
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

        {showEmailChecklist ? <EmailRequirementsChecklist email={email} /> : null}

        <TextField
          id="signup-username"
          name="username"
          label="Username"
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
          <UsernameRequirementsChecklist username={username} />
        ) : null}

        <TextField
          id="signup-password"
          name="password"
          label="Password"
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
          <PasswordRequirementsChecklist password={password} />
        ) : null}

        <TextField
          id="signup-confirm-password"
          name="confirmPassword"
          label="Confirm Password"
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
              Creating account...
            </Box>
          ) : (
            "Sign Up"
          )}
        </Button>

        <Typography sx={{ textAlign: "center", color: "#6B7280", mt: 0.5 }}>
          Already have an account?{" "}
          <Link
            component={RouterLink}
            to="/login"
            underline="hover"
            sx={{ color: "#F75F8A", fontWeight: 600 }}
          >
            Log In
          </Link>
        </Typography>

        <Button
          component={RouterLink}
          to="/"
          variant="text"
          disabled={submitting}
          sx={{ color: "#4A5568" }}
        >
          Back to home
        </Button>
      </Box>
    </Box>
  );
}

export default SignUpPage;
