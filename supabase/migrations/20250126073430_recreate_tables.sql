-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS app_tasklist;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS app_tasklist.tasks;
DROP TABLE IF EXISTS app_tasklist.users;

-- Create Users Table in app_tasklist schema
CREATE TABLE app_tasklist.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    profile_pic_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Tasks Table in app_tasklist schema
CREATE TABLE app_tasklist.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES app_tasklist.users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('Offen', 'In Arbeit', 'Warte auf..', 'Erledigt')) DEFAULT 'Offen',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_tasklist.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_tasklist.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access
CREATE POLICY "Anyone can read users"
    ON app_tasklist.users FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Anyone can create users"
    ON app_tasklist.users FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Anyone can update users"
    ON app_tasklist.users FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anyone can read tasks"
    ON app_tasklist.tasks FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Anyone can create tasks"
    ON app_tasklist.tasks FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Anyone can update tasks"
    ON app_tasklist.tasks FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anyone can delete tasks"
    ON app_tasklist.tasks FOR DELETE
    TO anon
    USING (true);

-- Insert sample users
INSERT INTO app_tasklist.users (id, name, profile_pic_url, created_at) VALUES 
    ('433b2983-c8c9-4120-8bd9-b1089a5ff162', 'Thomas', 'https://i.pravatar.cc/64?u=Julia', '2025-01-26 04:14:05.868543+00'),
    ('5379058e-bf45-432b-96e0-0a1f9487f9e8', 'Sophia', 'https://i.pravatar.cc/64?u=Anna', '2025-01-26 04:14:05.868543+00'),
    ('56a61220-44b5-4f41-9d46-084fab38bc21', 'Jan', 'https://i.pravatar.cc/64?u=Tom', '2025-01-26 04:14:05.868543+00');

-- Insert sample tasks
DO $$
DECLARE
    thomas_id UUID;
    sophia_id UUID;
    jan_id UUID;
BEGIN
    -- Get user IDs
    SELECT id INTO thomas_id FROM app_tasklist.users WHERE name = 'Thomas' LIMIT 1;
    SELECT id INTO sophia_id FROM app_tasklist.users WHERE name = 'Sophia' LIMIT 1;
    SELECT id INTO jan_id FROM app_tasklist.users WHERE name = 'Jan' LIMIT 1;

    -- Insert tasks
    INSERT INTO app_tasklist.tasks (title, owner_id, status) VALUES
        ('Homepage Design', thomas_id, 'In Arbeit'),
        ('API Integration', sophia_id, 'Offen'),
        ('Bug Fixes', jan_id, 'Warte auf..'),
        ('Documentation', sophia_id, 'Erledigt'),
        ('Testing', thomas_id, 'In Arbeit');
END $$;
