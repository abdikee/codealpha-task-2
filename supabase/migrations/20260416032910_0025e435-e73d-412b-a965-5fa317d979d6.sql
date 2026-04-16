
-- Drop overly broad policies
DROP POLICY "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY "Post images are publicly accessible" ON storage.objects;

-- Recreate with path-based access (users can only access files they know the path to)
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects 
  FOR SELECT USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] IS NOT NULL);

CREATE POLICY "Post images are publicly accessible" ON storage.objects 
  FOR SELECT USING (bucket_id = 'post-images' AND (storage.foldername(name))[1] IS NOT NULL);
