-- Supabase schema for real-time trends data

-- Create trends table to store trend data by timestamp
CREATE TABLE IF NOT EXISTS trends (
  id BIGSERIAL PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on timestamp for faster queries
CREATE INDEX IF NOT EXISTS idx_trends_timestamp ON trends(timestamp);

-- Create index on created_at for cleanup operations
CREATE INDEX IF NOT EXISTS idx_trends_created_at ON trends(created_at);

-- Create individual trend entries table for better querying
CREATE TABLE IF NOT EXISTS trend_entries (
  id BIGSERIAL PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  keyword VARCHAR(255) NOT NULL,
  score FLOAT NOT NULL,
  maxscore FLOAT NOT NULL,
  hashed VARCHAR(16) NOT NULL,
  delta INTEGER NOT NULL DEFAULT 999,
  rank INTEGER NOT NULL,
  engine VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for trend_entries
CREATE INDEX IF NOT EXISTS idx_trend_entries_timestamp ON trend_entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_trend_entries_keyword ON trend_entries(keyword);
CREATE INDEX IF NOT EXISTS idx_trend_entries_hashed ON trend_entries(hashed);
CREATE INDEX IF NOT EXISTS idx_trend_entries_rank ON trend_entries(rank);

-- Create exception keywords table
CREATE TABLE IF NOT EXISTS exception_keywords (
  id SERIAL PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default exception keywords
INSERT INTO exception_keywords (keyword) VALUES 
  ('Yesbet88'),
  ('sanopk')
ON CONFLICT (keyword) DO NOTHING;

-- Create view for latest trends
CREATE OR REPLACE VIEW latest_trends AS
SELECT 
  te.*,
  ROW_NUMBER() OVER (ORDER BY te.score DESC) as current_rank
FROM trend_entries te
WHERE te.timestamp = (
  SELECT MAX(timestamp) FROM trend_entries
)
ORDER BY te.score DESC;

-- Create view for trend history (last 24 hours)
CREATE OR REPLACE VIEW trend_history AS
SELECT 
  te.*,
  LAG(te.rank) OVER (PARTITION BY te.hashed ORDER BY te.timestamp) as previous_rank
FROM trend_entries te
WHERE te.timestamp > EXTRACT(epoch FROM NOW() - INTERVAL '24 hours')
ORDER BY te.timestamp DESC, te.rank ASC;

-- Function to clean up old data (keep last 48 entries)
CREATE OR REPLACE FUNCTION cleanup_old_trends()
RETURNS void AS $$
BEGIN
  -- Keep only the latest 48 timestamp entries (8 hours of data with 10-min intervals)
  DELETE FROM trends 
  WHERE timestamp NOT IN (
    SELECT timestamp 
    FROM trends 
    ORDER BY timestamp DESC 
    LIMIT 48
  );
  
  DELETE FROM trend_entries 
  WHERE timestamp NOT IN (
    SELECT timestamp 
    FROM trend_entries 
    ORDER BY timestamp DESC 
    LIMIT 48
  );
END;
$$ LANGUAGE plpgsql;

-- Create RLS (Row Level Security) policies if needed
-- ALTER TABLE trends ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE trend_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE exception_keywords ENABLE ROW LEVEL SECURITY;

-- Grant permissions for anon and authenticated users
-- GRANT SELECT ON trends TO anon, authenticated;
-- GRANT SELECT ON trend_entries TO anon, authenticated;
-- GRANT SELECT ON exception_keywords TO anon, authenticated;