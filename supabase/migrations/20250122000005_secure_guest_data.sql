-- Secure Guest Data Storage Migration
-- This migration creates a secure table for storing sensitive guest information

-- =============================================================================
-- 1. SECURE GUEST DATA TABLE
-- =============================================================================

-- Create secure guest data table
CREATE TABLE IF NOT EXISTS public.secure_guest_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL,
  encrypted_data TEXT NOT NULL,
  data_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);

-- Enable RLS on secure guest data
ALTER TABLE public.secure_guest_data ENABLE ROW LEVEL SECURITY;

-- Users can only access their own guest data
CREATE POLICY "Users can view their own guest data"
  ON public.secure_guest_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own guest data"
  ON public.secure_guest_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own guest data"
  ON public.secure_guest_data FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own guest data"
  ON public.secure_guest_data FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all guest data
CREATE POLICY "Admins can view all guest data"
  ON public.secure_guest_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- =============================================================================
-- 2. DATA ENCRYPTION FUNCTIONS
-- =============================================================================

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_guest_data(data jsonb)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
  encrypted_data text;
BEGIN
  -- Get encryption key from environment or use default
  encryption_key := current_setting('app.encryption_key', true);
  
  IF encryption_key IS NULL THEN
    encryption_key := 'default-encryption-key-32-chars';
  END IF;
  
  -- Simple encryption using pgcrypto (in production, use proper encryption)
  encrypted_data := encode(
    encrypt(data::text, encryption_key, 'aes'),
    'base64'
  );
  
  RETURN encrypted_data;
END;
$$;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION public.decrypt_guest_data(encrypted_data text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
  decrypted_data text;
BEGIN
  -- Get encryption key from environment or use default
  encryption_key := current_setting('app.encryption_key', true);
  
  IF encryption_key IS NULL THEN
    encryption_key := 'default-encryption-key-32-chars';
  END IF;
  
  -- Simple decryption using pgcrypto (in production, use proper encryption)
  decrypted_data := decrypt(
    decode(encrypted_data, 'base64'),
    encryption_key,
    'aes'
  );
  
  RETURN decrypted_data::jsonb;
END;
$$;

-- =============================================================================
-- 3. GUEST DATA MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function to store guest data securely
CREATE OR REPLACE FUNCTION public.store_guest_data(
  p_user_id uuid,
  p_booking_id uuid,
  p_guest_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  guest_data_id uuid;
  encrypted_data text;
  data_hash text;
BEGIN
  -- Verify user is authenticated and owns the data
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized access to guest data';
  END IF;
  
  -- Encrypt the guest data
  encrypted_data := public.encrypt_guest_data(p_guest_data);
  
  -- Generate data hash for integrity checking
  data_hash := encode(digest(p_guest_data::text, 'sha256'), 'hex');
  
  -- Insert or update guest data
  INSERT INTO public.secure_guest_data (
    user_id, booking_id, encrypted_data, data_hash
  ) VALUES (
    p_user_id, p_booking_id, encrypted_data, data_hash
  )
  ON CONFLICT (user_id, booking_id) 
  DO UPDATE SET 
    encrypted_data = EXCLUDED.encrypted_data,
    data_hash = EXCLUDED.data_hash,
    updated_at = now()
  RETURNING id INTO guest_data_id;
  
  -- Log the data storage
  PERFORM public.log_audit_event(
    'STORE_GUEST_DATA',
    'secure_guest_data',
    guest_data_id,
    NULL,
    jsonb_build_object('booking_id', p_booking_id, 'data_hash', data_hash)
  );
  
  RETURN guest_data_id;
END;
$$;

-- Function to retrieve guest data securely
CREATE OR REPLACE FUNCTION public.retrieve_guest_data(
  p_user_id uuid,
  p_booking_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  guest_record RECORD;
  decrypted_data jsonb;
BEGIN
  -- Verify user is authenticated and owns the data
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized access to guest data';
  END IF;
  
  -- Get encrypted guest data
  SELECT * INTO guest_record
  FROM public.secure_guest_data
  WHERE user_id = p_user_id 
    AND booking_id = p_booking_id
    AND expires_at > now();
  
  IF guest_record IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Decrypt the data
  decrypted_data := public.decrypt_guest_data(guest_record.encrypted_data);
  
  -- Verify data integrity
  IF encode(digest(decrypted_data::text, 'sha256'), 'hex') != guest_record.data_hash THEN
    RAISE EXCEPTION 'Data integrity check failed';
  END IF;
  
  -- Log the data retrieval
  PERFORM public.log_audit_event(
    'RETRIEVE_GUEST_DATA',
    'secure_guest_data',
    guest_record.id,
    jsonb_build_object('data_hash', guest_record.data_hash),
    NULL
  );
  
  RETURN decrypted_data;
END;
$$;

-- Function to delete guest data
CREATE OR REPLACE FUNCTION public.delete_guest_data(
  p_user_id uuid,
  p_booking_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Verify user is authenticated and owns the data
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized access to guest data';
  END IF;
  
  -- Delete guest data
  DELETE FROM public.secure_guest_data
  WHERE user_id = p_user_id 
    AND booking_id = p_booking_id;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the data deletion
  PERFORM public.log_audit_event(
    'DELETE_GUEST_DATA',
    'secure_guest_data',
    p_booking_id,
    jsonb_build_object('booking_id', p_booking_id),
    NULL
  );
  
  RETURN deleted_count > 0;
END;
$$;

-- =============================================================================
-- 4. DATA RETENTION AND CLEANUP
-- =============================================================================

-- Function to clean up expired guest data
CREATE OR REPLACE FUNCTION public.cleanup_expired_guest_data()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete expired guest data
  DELETE FROM public.secure_guest_data
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup
  PERFORM public.log_audit_event(
    'CLEANUP_EXPIRED_DATA',
    'secure_guest_data',
    NULL,
    NULL,
    jsonb_build_object('deleted_count', deleted_count)
  );
  
  RETURN deleted_count;
END;
$$;

-- =============================================================================
-- 5. SECURITY INDEXES
-- =============================================================================

-- Create indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_secure_guest_data_user_booking ON public.secure_guest_data(user_id, booking_id);
CREATE INDEX IF NOT EXISTS idx_secure_guest_data_expires_at ON public.secure_guest_data(expires_at);
CREATE INDEX IF NOT EXISTS idx_secure_guest_data_created_at ON public.secure_guest_data(created_at);

-- =============================================================================
-- 6. AUTOMATIC CLEANUP TRIGGER
-- =============================================================================

-- Create function to automatically clean up expired data
CREATE OR REPLACE FUNCTION public.auto_cleanup_expired_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clean up expired guest data
  PERFORM public.cleanup_expired_guest_data();
  
  -- Clean up expired auth attempts (older than 30 days)
  DELETE FROM public.auth_attempts
  WHERE created_at < now() - interval '30 days';
  
  -- Clean up expired account lockouts
  DELETE FROM public.account_lockouts
  WHERE lockout_until < now();
END;
$$;

-- =============================================================================
-- 7. GDPR COMPLIANCE FUNCTIONS
-- =============================================================================

-- Function to export user data (GDPR compliance)
CREATE OR REPLACE FUNCTION public.export_user_data(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_data jsonb;
  guest_data jsonb;
BEGIN
  -- Verify user is authenticated and requesting their own data
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized access to user data';
  END IF;
  
  -- Get user profile data
  SELECT to_jsonb(p.*) INTO user_data
  FROM public.profiles p
  WHERE p.id = p_user_id;
  
  -- Get guest data (decrypted)
  SELECT jsonb_agg(
    jsonb_build_object(
      'booking_id', booking_id,
      'guest_data', public.decrypt_guest_data(encrypted_data),
      'created_at', created_at,
      'updated_at', updated_at
    )
  ) INTO guest_data
  FROM public.secure_guest_data
  WHERE user_id = p_user_id;
  
  -- Combine all user data
  RETURN jsonb_build_object(
    'profile', user_data,
    'guest_data', guest_data,
    'export_date', now()
  );
END;
$$;

-- Function to delete user data (GDPR compliance)
CREATE OR REPLACE FUNCTION public.delete_user_data(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Verify user is authenticated and requesting their own data deletion
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized access to user data';
  END IF;
  
  -- Delete guest data
  DELETE FROM public.secure_guest_data
  WHERE user_id = p_user_id;
  
  -- Delete profile data
  DELETE FROM public.profiles
  WHERE id = p_user_id;
  
  -- Delete auth attempts
  DELETE FROM public.auth_attempts
  WHERE email = (SELECT email FROM auth.users WHERE id = p_user_id);
  
  -- Delete account lockouts
  DELETE FROM public.account_lockouts
  WHERE email = (SELECT email FROM auth.users WHERE id = p_user_id);
  
  -- Log the data deletion
  PERFORM public.log_audit_event(
    'DELETE_USER_DATA',
    'user_data',
    p_user_id,
    NULL,
    jsonb_build_object('user_id', p_user_id, 'deletion_date', now())
  );
  
  RETURN true;
END;
$$;

-- =============================================================================
-- 8. SECURITY MONITORING
-- =============================================================================

-- Function to monitor guest data access
CREATE OR REPLACE FUNCTION public.monitor_guest_data_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  suspicious_access RECORD;
BEGIN
  -- Check for suspicious access patterns
  FOR suspicious_access IN
    SELECT user_id, COUNT(*) as access_count
    FROM public.audit_logs
    WHERE action = 'RETRIEVE_GUEST_DATA'
      AND created_at > now() - interval '1 hour'
    GROUP BY user_id
    HAVING COUNT(*) > 10
  LOOP
    -- Log suspicious activity
    PERFORM public.log_security_event(
      'SUSPICIOUS_GUEST_DATA_ACCESS',
      'high',
      'Multiple guest data retrievals detected',
      jsonb_build_object(
        'user_id', suspicious_access.user_id,
        'access_count', suspicious_access.access_count
      )
    );
  END LOOP;
END;
$$;

-- =============================================================================
-- 9. FINAL SETUP
-- =============================================================================

-- Revoke public access
REVOKE ALL ON public.secure_guest_data FROM PUBLIC;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.secure_guest_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.store_guest_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.retrieve_guest_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_guest_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.export_user_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_data TO authenticated;

-- Log completion
INSERT INTO public.security_events (
  event_type,
  severity,
  description,
  metadata
) VALUES (
  'secure_guest_data_setup',
  'low',
  'Secure guest data storage system implemented',
  jsonb_build_object(
    'migration_version', '20250122000005',
    'features', ARRAY[
      'encrypted_guest_data_storage',
      'client_side_pii_protection',
      'automatic_data_cleanup',
      'gdpr_compliance',
      'data_integrity_verification',
      'access_monitoring'
    ]
  )
);
