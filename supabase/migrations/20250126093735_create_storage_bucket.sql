-- Create a storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to the avatars bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload avatars
CREATE POLICY "Anyone can upload avatars"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'avatars' );

-- Allow users to update their own avatars
CREATE POLICY "Anyone can update avatars"
ON storage.objects FOR UPDATE
TO public
USING ( bucket_id = 'avatars' )
WITH CHECK ( bucket_id = 'avatars' );
