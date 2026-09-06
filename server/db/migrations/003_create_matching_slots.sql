CREATE TABLE IF NOT EXISTS matching_slots (
    id SERIAL PRIMARY KEY,
    matching_id INTEGER NOT NULL REFERENCES matching (id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_selected BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT matching_slots_time_range
        CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS matching_slots_matching_id_idx
ON matching_slots (matching_id);
