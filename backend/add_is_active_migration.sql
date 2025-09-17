-- Migration to add is_active column to users table
-- This migration adds user account activation/deactivation functionality

-- Add is_active column with default value of TRUE (all existing users are active)
ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Add index on is_active for better query performance
CREATE INDEX idx_users_is_active ON users(is_active);

-- Update any existing users to be active (redundant but explicit)
UPDATE users SET is_active = TRUE WHERE is_active IS NULL;

-- Optional: Add comment to the column for documentation
COMMENT ON COLUMN users.is_active IS 'Controls whether user account is active and can log in. Managed by admins.';

-- Migration complete
-- All existing users will be marked as active
-- New users created via OTP will be active by default
-- Admins can deactivate users to prevent login
