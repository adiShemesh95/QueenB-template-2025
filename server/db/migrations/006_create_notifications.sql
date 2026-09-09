CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    receiver_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    matching_id INTEGER REFERENCES matching (id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS notifications_receiver_unread_idx
ON notifications (receiver_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_receiver_type_idx
ON notifications (receiver_id, type);

CREATE INDEX IF NOT EXISTS notifications_matching_type_idx
ON notifications (matching_id, type);
