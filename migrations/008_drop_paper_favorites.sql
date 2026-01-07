-- Migration 008: Drop paper_favorites table
-- The favorites feature is now handled via the Favorites collection (system collection)
-- This migration removes the deprecated paper_favorites table

-- Drop the table (this will also drop the associated indexes and foreign keys)
DROP TABLE IF EXISTS paper_favorites CASCADE;

-- Note: Data from paper_favorites is not migrated automatically.
-- Users who had favorites will need to re-add papers to their Favorites collection.
-- The Favorites collection is created automatically for new and existing users
-- when they first access the collections API.
