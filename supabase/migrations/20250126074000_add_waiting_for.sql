-- Add waiting_for_task_id to tasks table
ALTER TABLE public.tasks
ADD COLUMN waiting_for_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;
