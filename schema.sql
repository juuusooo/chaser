CREATE TABLE IF NOT EXISTS dibs (
  category    TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  drink       TEXT NOT NULL,
  reserved_at INTEGER NOT NULL
);
