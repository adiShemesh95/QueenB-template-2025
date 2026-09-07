import axios from "axios";

// Centralize Admin API calls so pages share one cookie-aware client
// and relative /api/admin paths (CRA proxy → backend).
// Backend authMiddleware + adminMiddleware remain the real security boundary.
const adminClient = axios.create({
  withCredentials: true,
});

/** GET /api/admin/users → { users } */
export async function getAdminUsers() {
  const response = await adminClient.get("/api/admin/users");
  return response.data.users ?? [];
}

/** GET /api/admin/users/:id → { user } */
export async function getAdminUserById(id) {
  try {
    const response = await adminClient.get(`/api/admin/users/${id}`);
    return response.data.user ?? null;
  } catch (err) {
    if (err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * GET /api/admin/matchings → { matchings }
 * Optional filters: status, participantId (sent to backend, not filtered client-side).
 */
export async function getAdminMatchings(filters = {}) {
  const params = {};
  if (filters.status) {
    params.status = filters.status;
  }
  if (filters.participantId != null && filters.participantId !== "") {
    params.participantId = filters.participantId;
  }
  const response = await adminClient.get("/api/admin/matchings", { params });
  return response.data.matchings ?? [];
}

/** GET /api/admin/matchings/:id → { matching } */
export async function getAdminMatchingById(id) {
  try {
    const response = await adminClient.get(`/api/admin/matchings/${id}`);
    return response.data.matching ?? null;
  } catch (err) {
    if (err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}
