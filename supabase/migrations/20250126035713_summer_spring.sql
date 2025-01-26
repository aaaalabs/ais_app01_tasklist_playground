/*
  # Initial Schema for Todo App

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text)
      - `profile_pic_url` (text)
      - `created_at` (timestamp)
    
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text)
      - `owner_id` (uuid, foreign key to users)
      - `status` (text with check constraint)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create Users Table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    profile_pic_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Tasks Table
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('Offen', 'In Arbeit', 'Warte auf..', 'Erledigt')) DEFAULT 'Offen',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can read all users"
    ON users
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own data"
    ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can read all tasks"
    ON tasks
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create tasks"
    ON tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update their own tasks"
    ON tasks
    FOR UPDATE
    TO authenticated
    USING (owner_id IN (
        SELECT id FROM users WHERE auth.uid() = users.id
    ));