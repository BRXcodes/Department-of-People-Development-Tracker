-- Shop Management bulletin board
-- Feedback / suggestions submitted for the shop manager (Keaton).
-- Run this in your Supabase SQL editor.

CREATE TABLE IF NOT EXISTS shop_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT,
  category TEXT NOT NULL DEFAULT 'suggestion',   -- suggestion | issue | supplies | kudos
  author TEXT,                                   -- optional; NULL/blank = anonymous
  status TEXT NOT NULL DEFAULT 'new',            -- new | reviewing | done | declined
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  upvotes INTEGER NOT NULL DEFAULT 0,
  manager_note TEXT,                             -- optional reply from the shop manager
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_posts_created ON shop_posts(created_at DESC);

-- Enable RLS
ALTER TABLE shop_posts ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (same pattern as existing tables)
CREATE POLICY "Allow all for shop_posts" ON shop_posts FOR ALL USING (true) WITH CHECK (true);
