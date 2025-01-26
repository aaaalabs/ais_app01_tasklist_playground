-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.aisws_tasks;
DROP TABLE IF EXISTS public.aisws_users;
DROP TYPE IF EXISTS public.aisws_task_status;

-- Create task status enum
CREATE TYPE public.aisws_task_status AS ENUM ('Offen', 'In Arbeit', 'Warte auf..', 'Erledigt');

-- Create Users Table in public schema
CREATE TABLE public.aisws_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    profile_pic_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Tasks Table in public schema
CREATE TABLE public.aisws_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES public.aisws_users(id) ON DELETE CASCADE,
    status public.aisws_task_status DEFAULT 'Offen',
    waiting_for_task_id UUID REFERENCES public.aisws_tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.aisws_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aisws_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access
CREATE POLICY "Anyone can read users"
    ON public.aisws_users FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Anyone can create users"
    ON public.aisws_users FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Anyone can update users"
    ON public.aisws_users FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anyone can read tasks"
    ON public.aisws_tasks FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Anyone can create tasks"
    ON public.aisws_tasks FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Anyone can update tasks"
    ON public.aisws_tasks FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anyone can delete tasks"
    ON public.aisws_tasks FOR DELETE
    TO anon
    USING (true);

-- Insert sample users
INSERT INTO public.aisws_users (id, name, profile_pic_url, created_at) VALUES 
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
    SELECT id INTO thomas_id FROM public.aisws_users WHERE name = 'Thomas' LIMIT 1;
    SELECT id INTO sophia_id FROM public.aisws_users WHERE name = 'Sophia' LIMIT 1;
    SELECT id INTO jan_id FROM public.aisws_users WHERE name = 'Jan' LIMIT 1;

    -- Insert tasks
    INSERT INTO public.aisws_tasks (title, owner_id, status) VALUES
        ('Homepage Design', thomas_id, 'In Arbeit'::public.aisws_task_status),
        ('API Integration', sophia_id, 'Offen'::public.aisws_task_status),
        ('Bug Fixes', jan_id, 'Warte auf..'::public.aisws_task_status),
        ('Documentation', sophia_id, 'Erledigt'::public.aisws_task_status),
        ('Testing', thomas_id, 'In Arbeit'::public.aisws_task_status);
END $$;
