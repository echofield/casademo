-- Migration: 013_profile_contact_fields.sql
-- Adds contact fields to profiles for seller validation

-- Add phone and personal_email columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personal_email TEXT;

-- Comment on columns
COMMENT ON COLUMN profiles.phone IS 'Seller phone number for contact validation';
COMMENT ON COLUMN profiles.personal_email IS 'Personal email (non-work) for contact validation';
