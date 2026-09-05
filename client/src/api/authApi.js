import axios from "axios";

const authClient = axios.create({
  withCredentials: true,
});

export async function registerUser(payload) {
  const response = await authClient.post("/api/auth/register", payload);
  return response.data;
}

export async function loginUser(payload) {
  const response = await authClient.post("/api/auth/login", payload);
  return response.data;
}

export async function logoutUser() {
  const response = await authClient.post("/api/auth/logout");
  return response.data;
}

export async function getCurrentUser() {
  const response = await authClient.get("/api/users/me");
  return response.data;
}
