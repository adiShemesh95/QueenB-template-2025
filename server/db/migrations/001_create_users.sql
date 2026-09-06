CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_email_format
        CHECK (
            email = lower(trim(email))
            AND position('@' IN email) > 1
        ),

    CONSTRAINT users_username_length
        CHECK (char_length(username) BETWEEN 3 AND 50),

    CONSTRAINT users_username_charset
        CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
ON users (email);

CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique
ON users (username);
