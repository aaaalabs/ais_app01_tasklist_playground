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
INSERT INTO app_tasklist.users (id, name, profile_pic_url) VALUES
    (gen_random_uuid(), 'Max', 'https://i.pravatar.cc/64?u=Max'),
    (gen_random_uuid(), 'Julia', 'https://i.pravatar.cc/64?u=Julia'),
    (gen_random_uuid(), 'Tom', 'https://i.pravatar.cc/64?u=Tom'),
    (gen_random_uuid(), 'Anna', 'https://i.pravatar.cc/64?u=Anna');

-- Insert sample tasks
DO $$
DECLARE
    max_id UUID;
    julia_id UUID;
    tom_id UUID;
    anna_id UUID;
BEGIN
    -- Get user IDs
    SELECT id INTO max_id FROM app_tasklist.users WHERE name = 'Max' LIMIT 1;
    SELECT id INTO julia_id FROM app_tasklist.users WHERE name = 'Julia' LIMIT 1;
    SELECT id INTO tom_id FROM app_tasklist.users WHERE name = 'Tom' LIMIT 1;
    SELECT id INTO anna_id FROM app_tasklist.users WHERE name = 'Anna' LIMIT 1;

    -- Insert tasks
    INSERT INTO app_tasklist.tasks (title, owner_id, status) VALUES
        ('Homepage Design', max_id, 'In Arbeit'),
        ('API Integration', julia_id, 'Offen'),
        ('Bug Fixes', tom_id, 'Warte auf..'),
        ('Documentation', anna_id, 'Erledigt'),
        ('Testing', max_id, 'In Arbeit');
END $$;
