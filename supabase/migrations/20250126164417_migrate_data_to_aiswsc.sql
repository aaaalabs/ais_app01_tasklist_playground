-- Migrate users data
INSERT INTO public.aiswsc_users (id, name, profile_pic_url, created_at)
SELECT id, name, profile_pic_url, created_at
FROM public.aisws_users;

-- Migrate tasks data
INSERT INTO public.aiswsc_tasks (id, title, description, owner_id, status, waiting_for_task_id, created_at, updated_at)
SELECT 
    id, 
    title, 
    description,
    owner_id,
    CASE status::text
        WHEN 'Offen' THEN 'Offen'::aiswsc_task_status
        WHEN 'In Arbeit' THEN 'In Arbeit'::aiswsc_task_status
        WHEN 'Wartet' THEN 'Wartet'::aiswsc_task_status
        WHEN 'Erledigt' THEN 'Erledigt'::aiswsc_task_status
    END,
    waiting_for_task_id,
    created_at,
    updated_at
FROM public.aisws_tasks;
