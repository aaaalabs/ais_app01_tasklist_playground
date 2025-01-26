-- First drop the foreign key constraints
ALTER TABLE public.aisws_tasks DROP CONSTRAINT IF EXISTS aisws_tasks_owner_id_fkey;
ALTER TABLE public.aisws_tasks DROP CONSTRAINT IF EXISTS aisws_tasks_waiting_for_task_id_fkey;

-- Rename the task status enum
ALTER TYPE public.aisws_task_status RENAME TO aiswsc_task_status;

-- Rename the tables
ALTER TABLE IF EXISTS public.aisws_tasks RENAME TO aiswsc_tasks;
ALTER TABLE IF EXISTS public.aisws_users RENAME TO aiswsc_users;

-- Re-create the foreign key constraints with new names
ALTER TABLE public.aiswsc_tasks
    ADD CONSTRAINT aiswsc_tasks_owner_id_fkey 
    FOREIGN KEY (owner_id) 
    REFERENCES aiswsc_users(id) 
    ON DELETE CASCADE;

ALTER TABLE public.aiswsc_tasks
    ADD CONSTRAINT aiswsc_tasks_waiting_for_task_id_fkey 
    FOREIGN KEY (waiting_for_task_id) 
    REFERENCES aiswsc_tasks(id) 
    ON DELETE SET NULL;
