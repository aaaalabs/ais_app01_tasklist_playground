-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS app_tasklist;

-- Add waiting_for_task_id column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'app_tasklist'
        AND table_name = 'tasks'
        AND column_name = 'waiting_for_task_id'
    ) THEN
        ALTER TABLE app_tasklist.tasks
        ADD COLUMN waiting_for_task_id UUID REFERENCES app_tasklist.tasks(id) ON DELETE SET NULL;
    END IF;
END $$;
