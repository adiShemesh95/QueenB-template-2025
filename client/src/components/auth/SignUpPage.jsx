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

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (utf8ByteLength(password) > MAX_PASSWORD_BYTES) {
    errors.password = "Password is too long.";
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
  const [fieldErrors, setFieldErrors] = useState(emptyFieldErrors());
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
          onChange={(e) => setEmail(e.target.value)}
          error={Boolean(fieldErrors.email)}
          helperText={fieldErrors.email || " "}
          disabled={submitting}
          fullWidth
          required
        />

        <TextField
          id="signup-username"
          name="username"
          label="Username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={Boolean(fieldErrors.username)}
          helperText={fieldErrors.username || " "}
          disabled={submitting}
          fullWidth
          required
        />

        <TextField
          id="signup-password"
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={Boolean(fieldErrors.password)}
          helperText={fieldErrors.password || " "}
          disabled={submitting}
          fullWidth
          required
        />

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
