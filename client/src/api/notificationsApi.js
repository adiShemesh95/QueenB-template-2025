import axios from "axios";

const notificationsClient = axios.create({
  withCredentials: true,
});

/**
 * GET /api/notifications/unread-count
 * @returns {Promise<{ total: number, mentor: number, mentee: number }>}
 */
export async function getUnreadNotificationCounts() {
  const response = await notificationsClient.get(
    "/api/notifications/unread-count"
  );
  const data = response.data || {};
  return {
    total: Number(data.total) || 0,
    mentor: Number(data.mentor) || 0,
    mentee: Number(data.mentee) || 0,
  };
}

/**
 * PUT /api/notifications/mark-read
 * @param {{ all?: boolean, audience?: 'mentor'|'mentee'|'all', ids?: number[] }} payload
 */
export async function markNotificationsRead(payload = { all: true }) {
  const response = await notificationsClient.put(
    "/api/notifications/mark-read",
    payload
  );
  return response.data;
}
