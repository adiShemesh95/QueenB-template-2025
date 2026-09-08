import axios from "axios";

const analyticsClient = axios.create({
  withCredentials: true,
});

/**
 * Client-safe analytics track. Backend only accepts mentor_profile_viewed.
 * Never send userId — the server uses req.user.id.
 */
export async function trackProfileViewed({ mentorUserId, source, metadata }) {
  const response = await analyticsClient.post("/api/analytics/events", {
    eventType: "mentor_profile_viewed",
    mentorUserId: Number(mentorUserId),
    source,
    metadata,
  });
  return response.data.event;
}
