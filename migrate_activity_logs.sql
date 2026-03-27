-- Run this once in your Neon DB SQL console if the audit log returns 500.
-- Adds the actor_name and actor_role columns if they don't already exist.

ALTER TABLE activity_logs
    ADD COLUMN IF NOT EXISTS actor_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS actor_role VARCHAR(100);
