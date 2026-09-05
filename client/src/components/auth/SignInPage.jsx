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

function emptyFieldErrors() {
  return {
    email: "",
    password: "",
  };
}

function validateSignIn({ email, password }) {
  const errors = emptyFieldErrors();

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  }

  return errors;
}

function hasFieldErrors(errors) {
  return Object.values(errors).some(Boolean);
}

function SignInPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

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
    const nextErrors = validateSignIn({
      email: trimmedEmail,
      password,
    });

    setFieldErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) {
      return;
    }

    setSubmitting(true);
    try {
      await login({
        email: trimmedEmail,
        password,
      });
      setPassword("");
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
      } else if (code === "INVALID_CREDENTIALS") {
        setGeneralError("Invalid email or password.");
      } else {
        setGeneralError(
          "Unable to sign in right now. Please try again."
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
          Sign In
        </Typography>

        <Typography
          sx={{ color: "#6B7280", textAlign: "center", mt: -0.5, mb: 0.5 }}
        >
          Welcome back to Queens Match
        </Typography>

        {generalError ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {generalError}
          </Alert>
        ) : null}

        <TextField
          id="signin-email"
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
          id="signin-password"
          name="password"
          label="Password"
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
              Signing in...
            </Box>
          ) : (
            "Sign In"
          )}
        </Button>

        <Typography sx={{ textAlign: "center", color: "#6B7280", mt: 0.5 }}>
          Don&apos;t have an account?{" "}
          <Link
            component={RouterLink}
            to="/register"
            underline="hover"
            sx={{ color: "#F75F8A", fontWeight: 600 }}
          >
            Sign Up
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

export default SignInPage;
