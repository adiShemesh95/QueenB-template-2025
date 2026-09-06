CREATE TABLE IF NOT EXISTS mentor_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    background TEXT,
    tech_stack TEXT[] NOT NULL DEFAULT '{}',
    job VARCHAR(255),
    company VARCHAR(255),
    years_experience INTEGER,
    topics TEXT[] NOT NULL DEFAULT '{}',
    max_sessions INTEGER NOT NULL DEFAULT 5,
    session_duration INTEGER NOT NULL DEFAULT 60,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    profile_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT mentor_profiles_years_experience_nonnegative
        CHECK (years_experience IS NULL OR years_experience >= 0),

    CONSTRAINT mentor_profiles_max_sessions_positive
        CHECK (max_sessions IS NULL OR max_sessions > 0),

    CONSTRAINT mentor_profiles_session_duration_positive
        CHECK (session_duration IS NULL OR session_duration > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS mentor_profiles_user_id_unique
ON mentor_profiles (user_id);

CREATE INDEX IF NOT EXISTS mentor_profiles_is_active_idx
ON mentor_profiles (is_active)
WHERE is_active = TRUE;
