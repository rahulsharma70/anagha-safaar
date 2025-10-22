-- Enhanced Security Migrations for Anagha Safaar
-- This migration adds comprehensive security features including PCI compliance, GDPR, audit logging, and fraud detection

-- Create audit log table for comprehensive tracking
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  risk_score INTEGER DEFAULT 0,
  fraud_flags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit logs are only accessible by admins (you can modify this policy as needed)
CREATE POLICY "Audit logs are viewable by admins only"
  ON public.audit_logs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create PCI compliance tables
CREATE TABLE public.payment_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  masked_card_number TEXT NOT NULL,
  card_type TEXT NOT NULL,
  expiry_month INTEGER NOT NULL,
  expiry_year INTEGER NOT NULL,
  last_four_digits TEXT NOT NULL,
  encrypted_data TEXT NOT NULL, -- Encrypted sensitive data
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Enable RLS on payment tokens
ALTER TABLE public.payment_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment tokens"
  ON public.payment_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment tokens"
  ON public.payment_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment tokens"
  ON public.payment_tokens FOR UPDATE
  USING (auth.uid() = user_id);

-- Create GDPR compliance tables
CREATE TABLE public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  purpose TEXT NOT NULL,
  data_categories TEXT[] NOT NULL,
  given_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'withdrawn', 'expired')),
  consent_method TEXT DEFAULT 'explicit',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on user consents
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consents"
  ON public.user_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own consents"
  ON public.user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consents"
  ON public.user_consents FOR UPDATE
  USING (auth.uid() = user_id);

-- Create data export requests table
CREATE TABLE public.data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_id TEXT NOT NULL UNIQUE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  download_url TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  data_categories TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on data exports
ALTER TABLE public.data_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data exports"
  ON public.data_exports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own data exports"
  ON public.data_exports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data exports"
  ON public.data_exports FOR UPDATE
  USING (auth.uid() = user_id);

-- Create data deletion requests table
CREATE TABLE public.data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL UNIQUE,
  data_categories TEXT[] NOT NULL,
  reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on data deletion requests
ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deletion requests"
  ON public.data_deletion_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deletion requests"
  ON public.data_deletion_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create personal data inventory table
CREATE TABLE public.personal_data_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  data_type TEXT NOT NULL,
  value TEXT NOT NULL,
  purpose TEXT NOT NULL,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  retention_period TEXT NOT NULL,
  is_encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on personal data inventory
ALTER TABLE public.personal_data_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own personal data"
  ON public.personal_data_inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own personal data"
  ON public.personal_data_inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal data"
  ON public.personal_data_inventory FOR UPDATE
  USING (auth.uid() = user_id);

-- Create fraud detection table
CREATE TABLE public.fraud_detection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address INET NOT NULL,
  user_agent TEXT,
  risk_score INTEGER NOT NULL DEFAULT 0,
  fraud_flags TEXT[] DEFAULT '{}'::text[],
  activity_type TEXT NOT NULL,
  activity_data JSONB DEFAULT '{}'::jsonb,
  is_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on fraud detection logs
ALTER TABLE public.fraud_detection_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fraud logs are viewable by admins only"
  ON public.fraud_detection_logs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Fraud logs can be inserted by system"
  ON public.fraud_detection_logs FOR INSERT
  WITH CHECK (true);

-- Create security events table
CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on security events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Security events are viewable by admins only"
  ON public.security_events FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Security events can be inserted by system"
  ON public.security_events FOR INSERT
  WITH CHECK (true);

-- Create rate limiting table
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP address or user ID
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(identifier, endpoint, window_start)
);

-- Enable RLS on rate limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rate limits are viewable by admins only"
  ON public.rate_limits FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Rate limits can be managed by system"
  ON public.rate_limits FOR ALL
  WITH CHECK (true);

-- Create session security table
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET NOT NULL,
  user_agent TEXT,
  location_data JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on user sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON public.user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.user_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Add security columns to existing tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS 
  phone_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  security_questions JSONB DEFAULT '{}'::jsonb,
  backup_codes TEXT[] DEFAULT '{}'::text[];

-- Add security columns to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS
  payment_token_id UUID REFERENCES public.payment_tokens(id),
  fraud_score INTEGER DEFAULT 0,
  fraud_flags TEXT[] DEFAULT '{}'::text[],
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  encrypted_guest_details TEXT, -- Encrypted version of guest_details
  audit_trail JSONB DEFAULT '[]'::jsonb;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_payment_tokens_user_id ON public.payment_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_tokens_expires_at ON public.payment_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_status ON public.user_consents(status);

CREATE INDEX IF NOT EXISTS idx_fraud_detection_ip ON public.fraud_detection_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_fraud_detection_created_at ON public.fraud_detection_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_fraud_detection_risk_score ON public.fraud_detection_logs(risk_score);

CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_start, window_end);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  old_data JSONB;
  new_data JSONB;
BEGIN
  -- Get old and new data
  IF TG_OP = 'DELETE' THEN
    old_data = to_jsonb(OLD);
    new_data = NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    old_data = to_jsonb(OLD);
    new_data = to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    old_data = NULL;
    new_data = to_jsonb(NEW);
  END IF;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    COALESCE(NEW.id, OLD.id), -- Use the record ID as user_id for now
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    old_data,
    new_data,
    inet_client_addr(),
    current_setting('request.headers', true)::jsonb->>'user-agent'
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create audit triggers for sensitive tables
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_bookings_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_payment_tokens_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_tokens
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_user_consents_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_consents
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Create function to clean up expired data
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Clean up expired payment tokens
  DELETE FROM public.payment_tokens 
  WHERE expires_at < now() AND is_active = false;

  -- Clean up expired sessions
  DELETE FROM public.user_sessions 
  WHERE expires_at < now() OR last_activity < now() - interval '7 days';

  -- Clean up old audit logs (keep for 1 year)
  DELETE FROM public.audit_logs 
  WHERE created_at < now() - interval '1 year';

  -- Clean up old fraud detection logs (keep for 6 months)
  DELETE FROM public.fraud_detection_logs 
  WHERE created_at < now() - interval '6 months';

  -- Clean up old rate limit records (keep for 1 day)
  DELETE FROM public.rate_limits 
  WHERE created_at < now() - interval '1 day';

  -- Clean up expired data exports
  DELETE FROM public.data_exports 
  WHERE expires_at < now() AND status = 'completed';

  -- Update expired consents
  UPDATE public.user_consents 
  SET status = 'expired' 
  WHERE expires_at < now() AND status = 'active';
END;
$$;

-- Create function to generate security report
CREATE OR REPLACE FUNCTION public.generate_security_report(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  report JSONB;
BEGIN
  SELECT jsonb_build_object(
    'period', jsonb_build_object(
      'start', start_date,
      'end', end_date
    ),
    'audit_logs', (
      SELECT count(*) FROM public.audit_logs 
      WHERE created_at BETWEEN start_date AND end_date
    ),
    'security_events', (
      SELECT jsonb_build_object(
        'total', count(*),
        'by_severity', jsonb_object_agg(severity, count)
      )
      FROM public.security_events 
      WHERE created_at BETWEEN start_date AND end_date
      GROUP BY severity
    ),
    'fraud_detection', (
      SELECT jsonb_build_object(
        'total_events', count(*),
        'high_risk_events', count(*) FILTER (WHERE risk_score > 70),
        'blocked_events', count(*) FILTER (WHERE is_blocked = true)
      )
      FROM public.fraud_detection_logs 
      WHERE created_at BETWEEN start_date AND end_date
    ),
    'rate_limiting', (
      SELECT jsonb_build_object(
        'total_requests', sum(request_count),
        'blocked_requests', count(*) FILTER (WHERE is_blocked = true)
      )
      FROM public.rate_limits 
      WHERE created_at BETWEEN start_date AND end_date
    ),
    'gdpr_compliance', (
      SELECT jsonb_build_object(
        'active_consents', count(*) FILTER (WHERE status = 'active'),
        'withdrawn_consents', count(*) FILTER (WHERE status = 'withdrawn'),
        'data_exports', count(*),
        'deletion_requests', count(*)
      )
      FROM public.user_consents uc
      LEFT JOIN public.data_exports de ON uc.user_id = de.user_id
      LEFT JOIN public.data_deletion_requests ddr ON uc.user_id = ddr.user_id
      WHERE uc.created_at BETWEEN start_date AND end_date
    )
  ) INTO report;
  
  RETURN report;
END;
$$;

-- Create updated_at triggers for new tables
CREATE TRIGGER update_user_consents_updated_at BEFORE UPDATE ON public.user_consents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_exports_updated_at BEFORE UPDATE ON public.data_exports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_deletion_requests_updated_at BEFORE UPDATE ON public.data_deletion_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personal_data_inventory_updated_at BEFORE UPDATE ON public.personal_data_inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON public.rate_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial security configuration
INSERT INTO public.security_config (key, value, description) VALUES
('max_login_attempts', '5', 'Maximum failed login attempts before account lockout'),
('lockout_duration_minutes', '30', 'Account lockout duration in minutes'),
('session_timeout_minutes', '30', 'Session timeout in minutes'),
('password_min_length', '8', 'Minimum password length'),
('require_2fa', 'false', 'Require two-factor authentication'),
('fraud_threshold', '70', 'Fraud detection threshold score'),
('rate_limit_requests_per_minute', '100', 'Rate limit requests per minute'),
('audit_retention_days', '365', 'Audit log retention period in days')
ON CONFLICT (key) DO NOTHING;

-- Create security configuration table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.security_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on security config
ALTER TABLE public.security_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Security config is viewable by admins only"
  ON public.security_config FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Security config can be updated by admins only"
  ON public.security_config FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create function to get security configuration
CREATE OR REPLACE FUNCTION public.get_security_config()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT jsonb_object_agg(key, value)
    FROM public.security_config
  );
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create view for security dashboard
CREATE VIEW public.security_dashboard AS
SELECT 
  'audit_logs' as table_name,
  count(*) as record_count,
  max(created_at) as last_activity
FROM public.audit_logs
UNION ALL
SELECT 
  'security_events' as table_name,
  count(*) as record_count,
  max(created_at) as last_activity
FROM public.security_events
UNION ALL
SELECT 
  'fraud_detection_logs' as table_name,
  count(*) as record_count,
  max(created_at) as last_activity
FROM public.fraud_detection_logs
UNION ALL
SELECT 
  'rate_limits' as table_name,
  count(*) as record_count,
  max(created_at) as last_activity
FROM public.rate_limits;

-- Enable RLS on security dashboard view
ALTER VIEW public.security_dashboard SET (security_invoker = true);

-- Create function to check user security status
CREATE OR REPLACE FUNCTION public.get_user_security_status(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'user_id', user_uuid,
    'profile', (
      SELECT jsonb_build_object(
        'email_verified', email_verified,
        'phone_verified', phone_verified,
        'two_factor_enabled', two_factor_enabled,
        'last_login_at', last_login_at,
        'login_count', login_count,
        'failed_login_attempts', failed_login_attempts,
        'locked_until', locked_until
      )
      FROM public.profiles 
      WHERE id = user_uuid
    ),
    'active_sessions', (
      SELECT count(*) 
      FROM public.user_sessions 
      WHERE user_id = user_uuid AND is_active = true AND expires_at > now()
    ),
    'recent_fraud_events', (
      SELECT count(*) 
      FROM public.fraud_detection_logs 
      WHERE user_id = user_uuid AND created_at > now() - interval '24 hours'
    ),
    'consent_status', (
      SELECT jsonb_build_object(
        'active_consents', count(*) FILTER (WHERE status = 'active'),
        'withdrawn_consents', count(*) FILTER (WHERE status = 'withdrawn'),
        'expired_consents', count(*) FILTER (WHERE status = 'expired')
      )
      FROM public.user_consents 
      WHERE user_id = user_uuid
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON public.profiles(email_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_verified ON public.profiles(phone_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_two_factor_enabled ON public.profiles(two_factor_enabled);
CREATE INDEX IF NOT EXISTS idx_profiles_locked_until ON public.profiles(locked_until);

CREATE INDEX IF NOT EXISTS idx_bookings_fraud_score ON public.bookings(fraud_score);
CREATE INDEX IF NOT EXISTS idx_bookings_verification_status ON public.bookings(verification_status);

-- Create function to automatically clean up expired data (run daily)
CREATE OR REPLACE FUNCTION public.schedule_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  PERFORM public.cleanup_expired_data();
  
  -- Log the cleanup
  INSERT INTO public.security_events (
    event_type,
    severity,
    description,
    metadata
  ) VALUES (
    'cleanup',
    'low',
    'Scheduled cleanup completed',
    jsonb_build_object('timestamp', now())
  );
END;
$$;
