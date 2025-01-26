/*
  # Add anonymous access policies

  1. Security Changes
    - Add policies for anonymous access to users table
    - Add policies for anonymous access to tasks table
    - Remove authentication requirements from existing policies

  Note: These policies allow full access to anonymous users while maintaining 
  data integrity through foreign key constraints
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can read all tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;

-- Create new policies for anonymous access
CREATE POLICY "Anyone can read users"
    ON users FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Anyone can create users"
    ON users FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Anyone can update users"
    ON users FOR UPDATE
    TO anon
    USING (true);

CREATE POLICY "Anyone can read tasks"
    ON tasks FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Anyone can create tasks"
    ON tasks FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Anyone can update tasks"
    ON tasks FOR UPDATE
    TO anon
    USING (true);