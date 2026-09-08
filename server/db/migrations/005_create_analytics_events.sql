-- Append-only analytics event log for Admin dashboards.
-- user_id / mentor_user_id: ON DELETE SET NULL preserves history if a user is removed.

CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_id INTEGER NULL REFERENCES users (id) ON DELETE SET NULL,
    mentor_user_id INTEGER NULL REFERENCES users (id) ON DELETE SET NULL,
    -- Soft reference only: matching is created by initMatchingTable.js, not numbered migrations.
    matching_id INTEGER NULL,
    -- Referral attribution: whatsapp | linkedin | copy_link | direct
    source VARCHAR(30) NOT NULL DEFAULT 'direct',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin aggregations by event type
CREATE INDEX IF NOT EXISTS analytics_events_event_type_idx
ON analytics_events (event_type);

-- Admin aggregations / filters by attribution source
CREATE INDEX IF NOT EXISTS analytics_events_source_idx
ON analytics_events (source);

-- Time-range filters and chronological ordering
CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx
ON analytics_events (created_at);

-- Mentor-scoped analytics filters
CREATE INDEX IF NOT EXISTS analytics_events_mentor_user_id_idx
ON analytics_events (mentor_user_id);

-- Lookup events for a specific matching request
CREATE INDEX IF NOT EXISTS analytics_events_matching_id_idx
ON analytics_events (matching_id);
