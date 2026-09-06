import { REQUEST_STATUS } from "./constants";

/**
 * Mock mentoring requests covering every status for UI testing.
 * Shape is intentionally close to a future API response so the UI
 * can swap to real endpoints with minimal changes.
 *
 * Optional fields (avatarUrl, mentor bio, cancel/reschedule metadata)
 * can be added later without restructuring cards/pages.
 */
export const MOCK_REQUESTS = [
  {
    id: "req-1",
    status: REQUEST_STATUS.PENDING_MENTOR,
    requestedAt: "2026-08-28T09:30:00.000Z",
    mentor: {
      id: "mentor-1",
      name: "Noa Levi",
      // Optional — layout works without it
      avatarUrl: null,
    },
    suggestedSlots: [],
    selectedSlot: null,
    meetingAt: null,
    moreTimesRequested: false,
  },
  {
    id: "req-2",
    status: REQUEST_STATUS.PENDING_MENTEE,
    requestedAt: "2026-08-25T14:00:00.000Z",
    mentor: {
      id: "mentor-2",
      name: "Maya Rosenberg",
      avatarUrl: null,
    },
    suggestedSlots: [
      {
        id: "slot-2a",
        start: "2026-09-10T09:00:00.000Z",
        end: "2026-09-10T10:00:00.000Z",
      },
      {
        id: "slot-2b",
        start: "2026-09-11T15:00:00.000Z",
        end: "2026-09-11T16:00:00.000Z",
      },
      {
        id: "slot-2c",
        start: "2026-09-12T11:30:00.000Z",
        end: "2026-09-12T12:30:00.000Z",
      },
    ],
    selectedSlot: null,
    meetingAt: null,
    moreTimesRequested: false,
  },
  {
    id: "req-3",
    status: REQUEST_STATUS.PENDING_MENTEE,
    requestedAt: "2026-08-20T11:15:00.000Z",
    mentor: {
      id: "mentor-3",
      name: "Yael Ben-David",
      avatarUrl: null,
    },
    suggestedSlots: [
      {
        id: "slot-3a",
        start: "2026-09-08T08:00:00.000Z",
        end: "2026-09-08T09:00:00.000Z",
      },
      {
        id: "slot-3b",
        start: "2026-09-09T17:00:00.000Z",
        end: "2026-09-09T18:00:00.000Z",
      },
    ],
    selectedSlot: null,
    meetingAt: null,
    // Demonstrates the one-time "request more times" limit
    moreTimesRequested: true,
  },
  {
    id: "req-4",
    status: REQUEST_STATUS.MATCHED,
    requestedAt: "2026-08-15T10:00:00.000Z",
    mentor: {
      id: "mentor-4",
      name: "Shira Avraham",
      avatarUrl: null,
    },
    suggestedSlots: [],
    selectedSlot: {
      id: "slot-4a",
      start: "2026-09-18T13:00:00.000Z",
      end: "2026-09-18T14:00:00.000Z",
    },
    meetingAt: "2026-09-18T13:00:00.000Z",
    moreTimesRequested: false,
  },
  {
    id: "req-5",
    status: REQUEST_STATUS.REJECTED,
    requestedAt: "2026-08-10T16:45:00.000Z",
    mentor: {
      id: "mentor-5",
      name: "Tamar Gold",
      avatarUrl: null,
    },
    suggestedSlots: [],
    selectedSlot: null,
    meetingAt: null,
    moreTimesRequested: false,
  },
];
