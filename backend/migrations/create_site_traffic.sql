CREATE TABLE IF NOT EXISTS site_traffic (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id TEXT NOT NULL,
    path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE site_traffic ENABLE ROW LEVEL SECURITY;

-- Allow anyone to casually log a visit (Insert ONLY)
CREATE POLICY "Allow public inserts" ON site_traffic
FOR INSERT WITH CHECK (true);

-- No public select policy needed since only the admin backend (via service_role) fetches it.
