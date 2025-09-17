-- UniNotesHub Database Initialization Script
-- This script sets up the initial database structure and configurations

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create database if it doesn't exist (this is handled by POSTGRES_DB env var)
-- But we can set up additional configurations here

-- Set default timezone
SET timezone = 'UTC';

-- Create indexes for better performance (these will be created by migrations, but good to have here)
-- Note: Tables will be created by Alembic migrations

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'UniNotesHub database initialized successfully';
END $$;
