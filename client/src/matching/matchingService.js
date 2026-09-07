import axios from "axios";
import { MOCK_REQUESTS } from "./mockData";

/**
 * Matching data access layer.
 *
 * getRequests(), getRequestById(), selectTimeSlot(), and requestMoreTimes()
 * call the real backend.
 *
 * Contract:
 *   getRequests()            -> Promise<Request[]>
 *   getRequestById(id)       -> Promise<Request | null>
 *   selectTimeSlot(id, slotId) -> Promise<Request>
 *   requestMoreTimes(id)     -> Promise<Request>
 */

const matchingClient = axios.create({
  withCredentials: true,
});

let requestsStore = structuredClone(MOCK_REQUESTS);

/**
 * Maps a matching table row from GET /api/matching to the UI Request shape.
 * Enriched responses may include mentor display fields and suggested_slots.
 */
function mapMatchingRow(row) {
  const slots = Array.isArray(row.suggested_slots)
    ? row.suggested_slots
    : Array.isArray(row.suggestedSlots)
      ? row.suggestedSlots
      : [];

  const mappedSlots = slots.map((slot) => ({
    id: slot.id,
    start: slot.start || slot.start_time,
    end: slot.end || slot.end_time,
  }));

  const selectedSlotRaw = row.selected_slot || row.selectedSlot || null;
  const selectedSlot = selectedSlotRaw
    ? {
        id: selectedSlotRaw.id,
        start: selectedSlotRaw.start || selectedSlotRaw.start_time,
        end: selectedSlotRaw.end || selectedSlotRaw.end_time,
      }
    : null;

  return {
    id: row.id,
    status: row.status,
    requestedAt: row.created_at,
    mentor: {
      id: row.mentor_id,
      name: row.mentor_username || row.mentor?.name || null,
      avatarUrl:
        row.mentor_profile_image_url || row.mentor?.avatarUrl || null,
    },
    suggestedSlots: mappedSlots,
    selectedSlot,
    meetingAt: selectedSlot?.start || null,
    moreTimesRequested: Boolean(row.more_times_requested),
  };
}

/** Fetches the logged-in mentee's matching requests from the backend. */
export async function getRequests() {
  const response = await matchingClient.get("/api/matching");
  const rows = Array.isArray(response.data) ? response.data : [];
  return rows.map(mapMatchingRow);
}

/** Fetches one matching request owned by the logged-in mentee. */
export async function getRequestById(id) {
  try {
    const response = await matchingClient.get(`/api/matching/${id}`);
    return mapMatchingRow(response.data);
  } catch (err) {
    if (err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Mentee confirms a suggested slot → request becomes MATCHED.
 * POST /api/matching/:id/select-slot
 */
export async function selectTimeSlot(requestId, slotId) {
  const response = await matchingClient.post(
    `/api/matching/${requestId}/select-slot`,
    { slotId }
  );
  return mapMatchingRow(response.data);
}

/**
 * Mentee asks the mentor for additional times (once per request).
 * POST /api/matching/:id/request-more-times
 */
export async function requestMoreTimes(requestId) {
  const response = await matchingClient.post(
    `/api/matching/${requestId}/request-more-times`
  );
  return mapMatchingRow(response.data);
}

/** Test helper — resets mock store to the initial seed data. */
export function __resetMockRequests() {
  requestsStore = structuredClone(MOCK_REQUESTS);
}
