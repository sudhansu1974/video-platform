-- Add PostgreSQL full-text search indexes for video search

-- Composite full-text search index on title + description
CREATE INDEX IF NOT EXISTS "Video_fulltext_idx" ON "Video" USING GIN (
  to_tsvector('english', "title" || ' ' || coalesce("description", ''))
);

-- Index for tag name search
CREATE INDEX IF NOT EXISTS "Tag_name_search_idx" ON "Tag" USING GIN (to_tsvector('english', "name"));

-- Index for username search
CREATE INDEX IF NOT EXISTS "User_username_search_idx" ON "User" USING GIN (to_tsvector('english', "username"));

-- Btree indexes for common filters (some may already exist from schema)
CREATE INDEX IF NOT EXISTS "Video_viewCount_idx" ON "Video" ("viewCount");
