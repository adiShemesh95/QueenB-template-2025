export const REQUEST_STATUS = {
  PENDING_MENTOR: "PENDING_MENTOR",
  PENDING_MENTEE: "PENDING_MENTEE",
  MATCHED: "MATCHED",
  REJECTED: "REJECTED",
};

export const STATUS_LABELS = {
  [REQUEST_STATUS.PENDING_MENTOR]: "Waiting for mentor",
  [REQUEST_STATUS.PENDING_MENTEE]: "Choose a time",
  [REQUEST_STATUS.MATCHED]: "Matched",
  [REQUEST_STATUS.REJECTED]: "Declined",
};

/** Chip colors aligned with the QueenB palette */
export const STATUS_COLORS = {
  [REQUEST_STATUS.PENDING_MENTOR]: {
    bg: "rgba(141, 216, 247, 0.22)",
    color: "#0B6E99",
  },
  [REQUEST_STATUS.PENDING_MENTEE]: {
    bg: "rgba(247, 95, 138, 0.12)",
    color: "#D93F68",
  },
  [REQUEST_STATUS.MATCHED]: {
    bg: "rgba(72, 187, 120, 0.15)",
    color: "#2F855A",
  },
  [REQUEST_STATUS.REJECTED]: {
    bg: "rgba(113, 128, 150, 0.14)",
    color: "#4A5568",
  },
};

export const FILTER_ALL = "ALL";

export const STATUS_FILTER_OPTIONS = [
  { value: FILTER_ALL, label: "All" },
  {
    value: REQUEST_STATUS.PENDING_MENTOR,
    label: STATUS_LABELS[REQUEST_STATUS.PENDING_MENTOR],
  },
  {
    value: REQUEST_STATUS.PENDING_MENTEE,
    label: STATUS_LABELS[REQUEST_STATUS.PENDING_MENTEE],
  },
  {
    value: REQUEST_STATUS.MATCHED,
    label: STATUS_LABELS[REQUEST_STATUS.MATCHED],
  },
  {
    value: REQUEST_STATUS.REJECTED,
    label: STATUS_LABELS[REQUEST_STATUS.REJECTED],
  },
];
