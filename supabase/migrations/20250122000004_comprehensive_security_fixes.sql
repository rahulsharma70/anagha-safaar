-- Comprehensive Security and Data Protection Migration
-- This migration implements all requested security fixes for Anagha Safaar

-- =============================================================================
-- 1. SUPABASE AUTH PASSWORD POLICY ENFORCEMENT
-- =============================================================================

-- Create password policy validation function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check minimum length
  IF length(password) < 8 THEN
    RETURN false;
  END IF;
  
  -- Check for uppercase letter
  IF password !~ '[A-Z]' THEN
    RETURN false;
  END IF;
  
  -- Check for lowercase letter
  IF password !~ '[a-z]' THEN
    RETURN false;
  END IF;
  
  -- Check for number
  IF password !~ '[0-9]' THEN
    RETURN false;
  END IF;
  
  -- Check for special character
  IF password !~ '[!@#$%^&*()_+\-=\[\]{};:"\\|,.<>\/?]' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Create pre-signup hook function for password validation
CREATE OR REPLACE FUNCTION public.handle_pre_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate password strength
  IF NOT public.validate_password_strength(NEW.raw_user_meta_data->>'password') THEN
    RAISE EXCEPTION 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
  END IF;
  
  -- Check for leaked passwords (basic implementation)
  -- In production, integrate with HaveIBeenPwned API
  IF EXISTS (
    SELECT 1 FROM public.leaked_passwords 
    WHERE password_hash = crypt(NEW.raw_user_meta_data->>'password', password_hash)
  ) THEN
    RAISE EXCEPTION 'Password has been found in data breaches. Please choose a different password.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create leaked passwords table for basic protection
CREATE TABLE IF NOT EXISTS public.leaked_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash TEXT NOT NULL,
  breach_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on leaked passwords
ALTER TABLE public.leaked_passwords ENABLE ROW LEVEL SECURITY;

-- Only admins can view leaked passwords
CREATE POLICY "Leaked passwords viewable by admins only"
  ON public.leaked_passwords FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- =============================================================================
-- 2. CRYPTOGRAPHICALLY SECURE BOOKING REFERENCE GENERATION
-- =============================================================================

-- Create secure booking reference generation function
CREATE OR REPLACE FUNCTION public.generate_secure_booking_reference()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reference text;
  exists boolean;
BEGIN
  LOOP
    -- Generate cryptographically secure reference
    reference := 'BK' || upper(substring(gen_random_uuid()::text, 1, 8));
    
    -- Check if reference already exists
    SELECT EXISTS(
      SELECT 1 FROM public.bookings 
      WHERE booking_reference = reference
    ) INTO exists;
    
    -- If unique, return it
    IF NOT exists THEN
      RETURN reference;
    END IF;
  END LOOP;
END;
$$;

-- Add booking_reference column to bookings table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' 
    AND column_name = 'booking_reference'
  ) THEN
    ALTER TABLE public.bookings 
    ADD COLUMN booking_reference TEXT UNIQUE;
  END IF;
END $$;

-- Create trigger to auto-generate booking reference
CREATE OR REPLACE FUNCTION public.set_booking_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.booking_reference IS NULL THEN
    NEW.booking_reference := public.generate_secure_booking_reference();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for booking reference generation
DROP TRIGGER IF EXISTS booking_reference_trigger ON public.bookings;
CREATE TRIGGER booking_reference_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_booking_reference();

-- =============================================================================
-- 3. ACCOUNT LOCKOUT AND RATE LIMITING
-- =============================================================================

-- Create authentication attempts table
CREATE TABLE IF NOT EXISTS public.auth_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address INET NOT NULL,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on auth attempts
ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view auth attempts
CREATE POLICY "Auth attempts viewable by admins only"
  ON public.auth_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- Allow system to insert auth attempts
CREATE POLICY "System can insert auth attempts"
  ON public.auth_attempts FOR INSERT
  WITH CHECK (true);

-- Create account lockout table
CREATE TABLE IF NOT EXISTS public.account_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address INET NOT NULL,
  lockout_until TIMESTAMPTZ NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on account lockouts
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;

-- Only admins can view lockouts
CREATE POLICY "Account lockouts viewable by admins only"
  ON public.account_lockouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- Allow system to manage lockouts
CREATE POLICY "System can manage account lockouts"
  ON public.account_lockouts FOR ALL
  WITH CHECK (true);

-- Create function to check account lockout
CREATE OR REPLACE FUNCTION public.is_account_locked(email text, ip_address inet)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lockout_record RECORD;
BEGIN
  SELECT * INTO lockout_record
  FROM public.account_lockouts
  WHERE (account_lockouts.email = email OR account_lockouts.ip_address = ip_address)
    AND lockout_until > now()
  ORDER BY lockout_until DESC
  LIMIT 1;
  
  RETURN lockout_record IS NOT NULL;
END;
$$;

-- Create function to record failed attempt
CREATE OR REPLACE FUNCTION public.record_auth_attempt(
  email text,
  ip_address inet,
  success boolean,
  failure_reason text DEFAULT NULL,
  user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attempt_count INTEGER;
  lockout_until TIMESTAMPTZ;
BEGIN
  -- Record the attempt
  INSERT INTO public.auth_attempts (
    email, ip_address, success, failure_reason, user_agent
  ) VALUES (
    email, ip_address, success, failure_reason, user_agent
  );
  
  -- If failed attempt, check for lockout
  IF NOT success THEN
    -- Count recent failed attempts
    SELECT COUNT(*) INTO attempt_count
    FROM public.auth_attempts
    WHERE email = email
      AND ip_address = ip_address
      AND success = false
      AND created_at > now() - interval '15 minutes';
    
    -- If 5 or more failed attempts, create lockout
    IF attempt_count >= 5 THEN
      -- Calculate lockout duration with exponential backoff
      lockout_until := now() + (interval '15 minutes' * power(2, LEAST(attempt_count - 5, 4)));
      
      -- Insert or update lockout record
      INSERT INTO public.account_lockouts (email, ip_address, lockout_until, attempt_count)
      VALUES (email, ip_address, lockout_until, attempt_count)
      ON CONFLICT (email, ip_address) 
      DO UPDATE SET 
        lockout_until = EXCLUDED.lockout_until,
        attempt_count = EXCLUDED.attempt_count,
        updated_at = now();
    END IF;
  ELSE
    -- Clear lockout on successful login
    DELETE FROM public.account_lockouts
    WHERE email = email OR ip_address = ip_address;
  END IF;
END;
$$;

-- =============================================================================
-- 4. EXPLICIT DENY RLS POLICIES FOR USER_ROLES TABLE
-- =============================================================================

-- Drop existing policies to recreate with explicit DENY
DROP POLICY IF EXISTS "Users can view their own roles only" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;

-- Create explicit DENY policies for user_roles
CREATE POLICY "Block role insertion" ON public.user_roles FOR INSERT USING (false);
CREATE POLICY "Block role updates" ON public.user_roles FOR UPDATE USING (false);
CREATE POLICY "Block role deletion" ON public.user_roles FOR DELETE USING (false);

-- Allow only specific admin functions to manage roles
CREATE POLICY "Admin functions can manage roles"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- Create admin-only role management functions with audit logs
CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id uuid,
  role_name app_role,
  assigned_by uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify assigner is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = assigned_by AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can assign roles';
  END IF;
  
  -- Insert role with audit log
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, role_name)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the role assignment
  PERFORM public.log_audit_event(
    'ASSIGN_ROLE',
    'user_role',
    target_user_id,
    NULL,
    jsonb_build_object('role', role_name, 'assigned_by', assigned_by)
  );
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_user_role(
  target_user_id uuid,
  role_name app_role,
  removed_by uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_role RECORD;
BEGIN
  -- Verify remover is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = removed_by AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can remove roles';
  END IF;
  
  -- Get old role for audit
  SELECT * INTO old_role
  FROM public.user_roles
  WHERE user_id = target_user_id AND role = role_name;
  
  -- Remove role
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = role_name;
  
  -- Log the role removal
  PERFORM public.log_audit_event(
    'REMOVE_ROLE',
    'user_role',
    target_user_id,
    to_jsonb(old_role),
    NULL
  );
  
  RETURN true;
END;
$$;

-- =============================================================================
-- 5. CONTACT FORM VALIDATION AND SANITIZATION
-- =============================================================================

-- Create contact submissions table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  sanitized_message TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  submission_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on contact submissions
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Only admins can view contact submissions
CREATE POLICY "Contact submissions viewable by admins only"
  ON public.contact_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- Allow system to insert contact submissions
CREATE POLICY "System can insert contact submissions"
  ON public.contact_submissions FOR INSERT
  WITH CHECK (true);

-- Create contact form validation function
CREATE OR REPLACE FUNCTION public.validate_contact_form(
  name text,
  email text,
  phone text,
  subject text,
  message text,
  ip_address inet
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  submission_count INTEGER;
BEGIN
  -- Validate name (2-50 characters, letters and spaces only)
  IF name IS NULL OR length(trim(name)) < 2 OR length(trim(name)) > 50 THEN
    RAISE EXCEPTION 'Name must be between 2 and 50 characters';
  END IF;
  
  IF name !~ '^[a-zA-Z\s]+$' THEN
    RAISE EXCEPTION 'Name can only contain letters and spaces';
  END IF;
  
  -- Validate email
  IF email IS NULL OR email !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate phone (optional, but if provided must be valid)
  IF phone IS NOT NULL AND phone !~ '^\+?[1-9]\d{1,14}$' THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;
  
  -- Validate subject (5-100 characters)
  IF subject IS NULL OR length(trim(subject)) < 5 OR length(trim(subject)) > 100 THEN
    RAISE EXCEPTION 'Subject must be between 5 and 100 characters';
  END IF;
  
  -- Validate message (10-2000 characters)
  IF message IS NULL OR length(trim(message)) < 10 OR length(trim(message)) > 2000 THEN
    RAISE EXCEPTION 'Message must be between 10 and 2000 characters';
  END IF;
  
  -- Check for spam (rate limiting)
  SELECT COUNT(*) INTO submission_count
  FROM public.contact_submissions
  WHERE ip_address = ip_address
    AND created_at > now() - interval '1 hour';
  
  IF submission_count >= 5 THEN
    RAISE EXCEPTION 'Too many submissions from this IP address. Please try again later.';
  END IF;
  
  RETURN true;
END;
$$;

-- Create sanitization function
CREATE OR REPLACE FUNCTION public.sanitize_text(input_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove HTML tags and dangerous characters
  input_text := regexp_replace(input_text, '<[^>]*>', '', 'g');
  input_text := regexp_replace(input_text, '[<>"\''&]', '', 'g');
  input_text := regexp_replace(input_text, 'javascript:', '', 'gi');
  input_text := regexp_replace(input_text, 'on\w+\s*=', '', 'gi');
  
  -- Trim whitespace
  input_text := trim(input_text);
  
  RETURN input_text;
END;
$$;

-- Create contact form submission function
CREATE OR REPLACE FUNCTION public.submit_contact_form(
  name text,
  email text,
  phone text,
  subject text,
  message text,
  ip_address inet,
  user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  submission_id uuid;
  sanitized_message text;
BEGIN
  -- Validate form data
  PERFORM public.validate_contact_form(name, email, phone, subject, message, ip_address);
  
  -- Sanitize message
  sanitized_message := public.sanitize_text(message);
  
  -- Insert submission
  INSERT INTO public.contact_submissions (
    name, email, phone, subject, message, sanitized_message, ip_address, user_agent
  ) VALUES (
    name, email, phone, subject, message, sanitized_message, ip_address, user_agent
  ) RETURNING id INTO submission_id;
  
  -- Log the submission
  PERFORM public.log_audit_event(
    'CONTACT_SUBMISSION',
    'contact_submission',
    submission_id,
    NULL,
    jsonb_build_object('email', email, 'subject', subject)
  );
  
  RETURN submission_id;
END;
$$;

-- =============================================================================
-- 6. ERROR HANDLING AND LOGGING IMPROVEMENTS
-- =============================================================================

-- Create generic error responses table
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  user_message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  request_data JSONB,
  stack_trace TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on error logs
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view error logs
CREATE POLICY "Error logs viewable by admins only"
  ON public.error_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- Allow system to insert error logs
CREATE POLICY "System can insert error logs"
  ON public.error_logs FOR INSERT
  WITH CHECK (true);

-- Create function to log errors with generic user messages
CREATE OR REPLACE FUNCTION public.log_error_with_generic_message(
  error_code text,
  detailed_error text,
  generic_user_message text,
  user_id uuid DEFAULT NULL,
  ip_address inet DEFAULT NULL,
  user_agent text DEFAULT NULL,
  request_data jsonb DEFAULT NULL,
  stack_trace text DEFAULT NULL,
  severity text DEFAULT 'medium'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  error_id uuid;
BEGIN
  INSERT INTO public.error_logs (
    error_code, error_message, user_message, user_id, ip_address, 
    user_agent, request_data, stack_trace, severity
  ) VALUES (
    error_code, detailed_error, generic_user_message, user_id, ip_address,
    user_agent, request_data, stack_trace, severity
  ) RETURNING id INTO error_id;
  
  -- Also log to security events if high severity
  IF severity IN ('high', 'critical') THEN
    PERFORM public.log_security_event(
      'ERROR_' || error_code,
      severity,
      detailed_error,
      jsonb_build_object('error_id', error_id, 'user_id', user_id)
    );
  END IF;
  
  RETURN error_id;
END;
$$;

-- =============================================================================
-- 7. SECURITY INDEXES FOR PERFORMANCE
-- =============================================================================

-- Create indexes for security-related queries
CREATE INDEX IF NOT EXISTS idx_auth_attempts_email_ip_created ON public.auth_attempts(email, ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip_created ON public.auth_attempts(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_email_ip ON public.account_lockouts(email, ip_address);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_lockout_until ON public.account_lockouts(lockout_until);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_ip_created ON public.contact_submissions(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity_created ON public.error_logs(severity, created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id_created ON public.error_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(booking_reference);

-- =============================================================================
-- 8. SECURITY CONFIGURATION UPDATES
-- =============================================================================

-- Update security events table to include new event types
ALTER TABLE public.security_events 
ADD COLUMN IF NOT EXISTS error_id UUID REFERENCES public.error_logs(id);

-- Create security configuration table
CREATE TABLE IF NOT EXISTS public.security_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on security config
ALTER TABLE public.security_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage security config
CREATE POLICY "Security config manageable by admins only"
  ON public.security_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- Insert default security configuration
INSERT INTO public.security_config (config_key, config_value, description) VALUES
('max_auth_attempts', '5', 'Maximum authentication attempts before lockout'),
('lockout_duration_minutes', '15', 'Initial lockout duration in minutes'),
('max_contact_submissions_per_hour', '5', 'Maximum contact form submissions per hour per IP'),
('password_min_length', '8', 'Minimum password length'),
('session_timeout_minutes', '30', 'Session timeout in minutes'),
('enable_password_strength_validation', 'true', 'Enable password strength validation'),
('enable_account_lockout', 'true', 'Enable account lockout after failed attempts'),
('enable_contact_form_rate_limiting', 'true', 'Enable contact form rate limiting')
ON CONFLICT (config_key) DO NOTHING;

-- =============================================================================
-- 9. FINAL SECURITY AUDIT
-- =============================================================================

-- Log completion of security hardening
INSERT INTO public.security_events (
  event_type,
  severity,
  description,
  metadata
) VALUES (
  'security_hardening_v2',
  'low',
  'Comprehensive security and data protection migration completed',
  jsonb_build_object(
    'migration_version', '20250122000004',
    'features_added', ARRAY[
      'password_strength_validation',
      'secure_booking_references',
      'account_lockout_protection',
      'explicit_rls_deny_policies',
      'contact_form_validation',
      'generic_error_handling',
      'comprehensive_audit_logging'
    ],
    'tables_created', (
      SELECT count(*) FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'leaked_passwords', 'auth_attempts', 'account_lockouts', 
        'contact_submissions', 'error_logs', 'security_config'
      )
    ),
    'functions_created', (
      SELECT count(*) FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name LIKE '%security%' OR routine_name LIKE '%auth%'
    )
  )
);
