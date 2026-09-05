function buildError(code, message, details = []) {
  const error = { code, message };
  if (details && details.length > 0) {
    error.details = details;
  }
  return { error };
}

function validationError(message = "Please fix the highlighted fields.", details = []) {
  return buildError("VALIDATION_ERROR", message, details);
}

function invalidCredentialsError(
  message = "Invalid email or password."
) {
  return buildError("INVALID_CREDENTIALS", message);
}

function unauthorizedError(message = "Authentication required.") {
  return buildError("UNAUTHORIZED", message);
}

function emailTakenError(message = "An account with this email already exists.") {
  return buildError("EMAIL_TAKEN", message);
}

function usernameTakenError(
  message = "This username is already taken."
) {
  return buildError("USERNAME_TAKEN", message);
}

function internalError(message = "Something went wrong. Please try again later.") {
  return buildError("INTERNAL_ERROR", message);
}

module.exports = {
  buildError,
  validationError,
  invalidCredentialsError,
  unauthorizedError,
  emailTakenError,
  usernameTakenError,
  internalError,
};
