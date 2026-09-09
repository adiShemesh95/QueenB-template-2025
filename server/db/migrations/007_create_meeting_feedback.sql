-- Tracks post-meeting feedback so cron jobs can remind and thank mentors.
CREATE TABLE IF NOT EXISTS meeting_feedback (
    id SERIAL PRIMARY KEY,
    matching_id INTEGER NOT NULL REFERENCES matching (id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    attended BOOLEAN,
    rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT meeting_feedback_matching_user_unique UNIQUE (matching_id, user_id)
);

CREATE INDEX IF NOT EXISTS meeting_feedback_matching_id_idx
ON meeting_feedback (matching_id);
