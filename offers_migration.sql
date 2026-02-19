-- Create the offers table
CREATE TABLE IF NOT EXISTS offers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    discount TEXT NOT NULL,
    code TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow everyone to read offers (public)
CREATE POLICY "Enable read access for all users" ON offers
    FOR SELECT USING (true);

-- Policy: Allow all users to insert/delete (simulated admin access for now)
-- In a real app, you would restrict these to authenticated admins only.
CREATE POLICY "Enable insert for all users" ON offers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON offers
    FOR DELETE USING (true);
