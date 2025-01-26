/*
  # Add placeholder data

  1. Insert Data
    - Add 4 sample users with profile pictures
    - Add 5 sample tasks with different statuses
    - Use gen_random_uuid() for IDs
*/

-- Insert sample users
INSERT INTO app_tasklist.users (id, name, profile_pic_url) VALUES
  (gen_random_uuid(), 'Max', 'https://i.pravatar.cc/64?u=Max'),
  (gen_random_uuid(), 'Julia', 'https://i.pravatar.cc/64?u=Julia'),
  (gen_random_uuid(), 'Tom', 'https://i.pravatar.cc/64?u=Tom'),
  (gen_random_uuid(), 'Anna', 'https://i.pravatar.cc/64?u=Anna');

-- Insert sample tasks (using a DO block to reference user IDs)
DO $$
DECLARE
  max_id UUID;
  julia_id UUID;
  tom_id UUID;
  anna_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO max_id FROM app_tasklist.users WHERE name = 'Max' LIMIT 1;
  SELECT id INTO julia_id FROM app_tasklist.users WHERE name = 'Julia' LIMIT 1;
  SELECT id INTO tom_id FROM app_tasklist.users WHERE name = 'Tom' LIMIT 1;
  SELECT id INTO anna_id FROM app_tasklist.users WHERE name = 'Anna' LIMIT 1;

  -- Insert tasks
  INSERT INTO app_tasklist.tasks (title, owner_id, status) VALUES
    ('Website Design überarbeiten', max_id, 'Offen'),
    ('Kundenpräsentation vorbereiten', julia_id, 'In Arbeit'),
    ('Projektplan erstellen', tom_id, 'Warte auf..'),
    ('Bug-Fixes implementieren', anna_id, 'In Arbeit'),
    ('Dokumentation aktualisieren', max_id, 'Erledigt');
END;
$$;