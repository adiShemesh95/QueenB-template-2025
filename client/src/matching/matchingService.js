import { MOCK_REQUESTS } from "./mockData";
import { REQUEST_STATUS } from "./constants";

/**
 * Matching data access layer.
 *
 * Today this reads/mutates in-memory mock data.
 * Later, replace the function bodies with API calls (e.g. axios)
 * without changing page/component contracts.
 *
 * Contract:
 *   getRequests()            -> Promise<Request[]>
 *   getRequestById(id)       -> Promise<Request | null>
 *   selectTimeSlot(id, slotId) -> Promise<Request>
 *   requestMoreTimes(id)     -> Promise<Request>
 */

let requestsStore = structuredClone(MOCK_REQUESTS);

function findRequestOrThrow(id) {
  const request = requestsStore.find((item) => item.id === id);
  if (!request) {
    throw new Error(`Request not found: ${id}`);
  }
  return request;
}

/** Simulate a short network delay so UI loading states are easy to test later. */
function delay(ms = 120) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getRequests() {
  await delay();
  return structuredClone(requestsStore);
}

export async function getRequestById(id) {
  await delay();
  const request = requestsStore.find((item) => item.id === id);
  return request ? structuredClone(request) : null;
}

/**
 * Mentee confirms a suggested slot → request becomes MATCHED.
 * Replace with POST/PATCH to the real matching API later.
 */
export async function selectTimeSlot(requestId, slotId) {
  await delay();
  const request = findRequestOrThrow(requestId);

  if (request.status !== REQUEST_STATUS.PENDING_MENTEE) {
    throw new Error(
      "Time selection is only available while waiting for mentee choice."
    );
  }

  const slot = request.suggestedSlots.find((item) => item.id === slotId);
  if (!slot) {
    throw new Error(`Slot not found: ${slotId}`);
  }

  request.selectedSlot = { ...slot };
  request.meetingAt = slot.start;
  request.status = REQUEST_STATUS.MATCHED;

  return structuredClone(request);
}

/**
 * Mentee asks the mentor for additional times (once per request).
 * Replace with a real API call later; keep the same return shape.
 */
export async function requestMoreTimes(requestId) {
  await delay();
  const request = findRequestOrThrow(requestId);

  if (request.status !== REQUEST_STATUS.PENDING_MENTEE) {
    throw new Error(
      "Additional times can only be requested while choosing a slot."
    );
  }

  if (request.moreTimesRequested) {
    throw new Error("Additional times were already requested for this meeting.");
  }

  request.moreTimesRequested = true;
  return structuredClone(request);
}

/** Test helper — resets mock store to the initial seed data. */
export function __resetMockRequests() {
  requestsStore = structuredClone(MOCK_REQUESTS);
}
