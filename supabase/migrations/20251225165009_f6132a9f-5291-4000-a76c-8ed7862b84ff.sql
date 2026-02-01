-- Allow authenticated users to insert their own roles
CREATE POLICY "Users can add their own roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own roles (for future use)
CREATE POLICY "Users can remove their own roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);