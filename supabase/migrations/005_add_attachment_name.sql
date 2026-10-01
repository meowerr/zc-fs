-- Migration 005: Add attachment_name to messages table
-- Ensures backwards and forwards compatibility for file/CAD attachment labels
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_name TEXT;
