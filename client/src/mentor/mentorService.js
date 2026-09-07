import axios from "axios";

/**
 * Mentor feature API client (cookie JWT via withCredentials).
 */

const mentorClient = axios.create({
  withCredentials: true,
});

export const MENTOR_TOPICS = [
  "Mock Interview",
  "Career Planning",
  "Company Guidance",
  "Resume Review",
  "Tech Skills",
];

/** GET /api/mentors — active mentors directory */
export async function getMentors() {
  const response = await mentorClient.get("/api/mentors");
  return Array.isArray(response.data) ? response.data : [];
}

/** GET /api/mentors/:id — mentor profile detail */
export async function getMentorById(id) {
  try {
    const response = await mentorClient.get(`/api/mentors/${id}`);
    return response.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

/** GET /api/mentor-profile — logged-in user's profile (or null) */
export async function getMyMentorProfile() {
  try {
    const response = await mentorClient.get("/api/mentor-profile");
    return response.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

/** POST /api/mentor-profile — create or update */
export async function saveMentorProfile(payload) {
  const response = await mentorClient.post("/api/mentor-profile", payload);
  return response.data;
}

/** GET /api/mentor-requests — incoming requests for mentor */
export async function getMentorRequests() {
  const response = await mentorClient.get("/api/mentor-requests");
  return Array.isArray(response.data) ? response.data : [];
}

/** POST /api/mentor-requests/:id/slots */
export async function proposeSlots(requestId, slots) {
  const response = await mentorClient.post(
    `/api/mentor-requests/${requestId}/slots`,
    { slots }
  );
  return response.data;
}

/** POST /api/mentor-requests/:id/reject */
export async function rejectMentorRequest(requestId) {
  const response = await mentorClient.post(
    `/api/mentor-requests/${requestId}/reject`
  );
  return response.data;
}

/** POST /api/matching — mentee requests this mentor (mentorId = users.id) */
export async function requestMentorship(mentorUserId) {
  const response = await mentorClient.post("/api/matching", {
    mentorId: Number(mentorUserId),
  });
  return response.data;
}
