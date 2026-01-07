-- Collections feature: allows users to organize papers into custom groups
-- Similar to playlists for music - papers can belong to multiple collections

-- Table for user-defined collections
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6366f1', -- Hex color code (default: Indigo)
  icon VARCHAR(20) DEFAULT 'folder',
  display_order INTEGER DEFAULT 0,
  is_system BOOLEAN DEFAULT FALSE, -- System collections cannot be deleted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for paper-collection relationships (many-to-many)
CREATE TABLE IF NOT EXISTS paper_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent duplicate collection names per user
ALTER TABLE collections
ADD CONSTRAINT collections_user_name_unique UNIQUE (user_id, name);

-- Prevent duplicate paper assignments to the same collection
ALTER TABLE paper_collections
ADD CONSTRAINT paper_collections_paper_collection_unique UNIQUE (paper_id, collection_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_display_order ON collections(user_id, display_order);
CREATE INDEX IF NOT EXISTS idx_paper_collections_collection_id ON paper_collections(collection_id);
CREATE INDEX IF NOT EXISTS idx_paper_collections_paper_id ON paper_collections(paper_id);

-- Enable Row Level Security
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_collections ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own collections
CREATE POLICY "Users can manage their own collections"
ON collections
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only manage paper_collections for their own collections
-- This requires checking that the collection belongs to the user
CREATE POLICY "Users can manage paper_collections for their own collections"
ON paper_collections
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM collections
    WHERE collections.id = paper_collections.collection_id
    AND collections.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM collections
    WHERE collections.id = paper_collections.collection_id
    AND collections.user_id = auth.uid()
  )
);

-- Trigger function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to collections table
DROP TRIGGER IF EXISTS collections_updated_at_trigger ON collections;
CREATE TRIGGER collections_updated_at_trigger
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION update_collections_updated_at();
