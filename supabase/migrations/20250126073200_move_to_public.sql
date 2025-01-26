/*
  # Move tables to public schema
  
  1. Move Tables
    - Move users and tasks tables from app_tasklist to public schema
    - Recreate policies in public schema
*/

-- Move tables to public schema
ALTER TABLE app_tasklist.users SET SCHEMA public;
ALTER TABLE app_tasklist.tasks SET SCHEMA public;

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can read users" ON app_tasklist.users;
DROP POLICY IF EXISTS "Anyone can create users" ON app_tasklist.users;
DROP POLICY IF EXISTS "Anyone can update users" ON app_tasklist.users;
DROP POLICY IF EXISTS "Anyone can read tasks" ON app_tasklist.tasks;
DROP POLICY IF EXISTS "Anyone can create tasks" ON app_tasklist.tasks;
DROP POLICY IF EXISTS "Anyone can update tasks" ON app_tasklist.tasks;

-- Create new policies in public schema
CREATE POLICY "Anyone can read users"
    ON public.users FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Anyone can create users"
    ON public.users FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Anyone can update users"
    ON public.users FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anyone can read tasks"
    ON public.tasks FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Anyone can create tasks"
    ON public.tasks FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Anyone can update tasks"
    ON public.tasks FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);
