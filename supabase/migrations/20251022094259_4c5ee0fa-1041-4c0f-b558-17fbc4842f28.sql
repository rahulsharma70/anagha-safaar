-- Add explicit DENY policies for user_roles table write operations
-- This provides defense-in-depth protection against any accidental role modifications
-- Only SECURITY DEFINER admin functions should modify roles

-- Block all direct role insertions
CREATE POLICY "Block role insertion"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Block all direct role updates
CREATE POLICY "Block role updates"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Block all direct role deletions
CREATE POLICY "Block role deletion"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (false);

-- Add comment explaining the security model
COMMENT ON TABLE user_roles IS 'User roles table with explicit DENY policies. All role modifications must go through SECURITY DEFINER admin functions with audit logging.';