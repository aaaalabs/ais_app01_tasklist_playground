/*
  # Create app_tasklist schema and tables

  1. Schema Creation
    - Create new schema `app_tasklist`
    - Set search path to include the new schema

  2. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text)
      - `profile_pic_url` (text)
      - `created_at` (timestamp with time zone)
    
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text)
      - `owner_id` (uuid, foreign key to users)
      - `status` (text with check constraint)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  3. Security
    - Enable RLS on both tables
    - Add policies for anonymous access
*/

-- Create new schema
CREATE SCHEMA IF NOT EXISTS app_tasklist;

-- Set search path
ALTER DATABASE postgres SET search_path TO app_tasklist, public;

-- Create Users Table
CREATE TABLE IF NOT EXISTS app_tasklist.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    profile_pic_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Tasks Table
CREATE TABLE IF NOT EXISTS app_tasklist.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES app_tasklist.users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('Offen', 'In Arbeit', 'Warte auf..', 'Erledigt')) DEFAULT 'Offen',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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
    USING (true);

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
    USING (true);