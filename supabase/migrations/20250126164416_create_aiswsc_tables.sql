-- Create the task status enum
CREATE TYPE public.aiswsc_task_status AS ENUM ('Offen', 'In Arbeit', 'Wartet', 'Erledigt');

-- Create users table
CREATE TABLE public.aiswsc_users (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    profile_pic_url text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT aiswsc_users_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Create tasks table
CREATE TABLE public.aiswsc_tasks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    owner_id uuid NOT NULL,
    status public.aiswsc_task_status DEFAULT 'Offen'::aiswsc_task_status,
    waiting_for_task_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT aiswsc_tasks_pkey PRIMARY KEY (id),
    CONSTRAINT aiswsc_tasks_owner_id_fkey FOREIGN KEY (owner_id)
        REFERENCES public.aiswsc_users(id) ON DELETE CASCADE,
    CONSTRAINT aiswsc_tasks_waiting_for_task_id_fkey FOREIGN KEY (waiting_for_task_id)
        REFERENCES public.aiswsc_tasks(id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS aiswsc_tasks_owner_id_idx ON public.aiswsc_tasks(owner_id);
CREATE INDEX IF NOT EXISTS aiswsc_tasks_waiting_for_task_id_idx ON public.aiswsc_tasks(waiting_for_task_id);
CREATE INDEX IF NOT EXISTS aiswsc_tasks_status_idx ON public.aiswsc_tasks(status);

-- Set up Row Level Security (RLS)
ALTER TABLE public.aiswsc_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aiswsc_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.aiswsc_users;
DROP POLICY IF EXISTS "Enable insert for users" ON public.aiswsc_users;
DROP POLICY IF EXISTS "Enable update for users" ON public.aiswsc_users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.aiswsc_tasks;
DROP POLICY IF EXISTS "Enable insert for users" ON public.aiswsc_tasks;
DROP POLICY IF EXISTS "Enable update for task owners" ON public.aiswsc_tasks;
DROP POLICY IF EXISTS "Enable delete for task owners" ON public.aiswsc_tasks;

-- Create policies for users table
CREATE POLICY "Enable read access for all users"
    ON public.aiswsc_users
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Enable insert for users"
    ON public.aiswsc_users
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Enable update for users"
    ON public.aiswsc_users
    FOR UPDATE
    TO public
    USING (true);

-- Create policies for tasks table
CREATE POLICY "Enable read access for all users"
    ON public.aiswsc_tasks
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Enable insert for users"
    ON public.aiswsc_tasks
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Enable update for users"
    ON public.aiswsc_tasks
    FOR UPDATE
    TO public
    USING (true);

CREATE POLICY "Enable delete for users"
    ON public.aiswsc_tasks
    FOR DELETE
    TO public
    USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.aiswsc_users TO anon, authenticated;
GRANT ALL ON public.aiswsc_tasks TO anon, authenticated;
