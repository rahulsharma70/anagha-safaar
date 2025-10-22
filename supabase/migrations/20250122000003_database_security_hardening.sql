-- Comprehensive Database Security Hardening Migration
-- This migration implements full RLS security, audit policies, and compliance measures

-- =============================================================================
-- 1. SECURITY AUDIT AND RLS POLICY ENFORCEMENT
-- =============================================================================

-- First, let's ensure all tables have RLS enabled and proper policies
-- This is a comprehensive security audit and hardening

-- =============================================================================
-- 2. USER ROLES TABLE SECURITY HARDENING
-- =============================================================================

-- Ensure user_roles has strict RLS policies
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate with stricter rules
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Strict RLS policies for user_roles
CREATE POLICY "Users can view their own roles only"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- =============================================================================
-- 3. PROFILES TABLE SECURITY HARDENING
-- =============================================================================

-- Ensure profiles has strict RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate with stricter rules
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Strict RLS policies for profiles
CREATE POLICY "Users can view their own profile only"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile only"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile only"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- =============================================================================
-- 4. BOOKINGS TABLE SECURITY HARDENING
-- =============================================================================

-- Ensure bookings has strict RLS policies
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate with stricter rules
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;

-- Strict RLS policies for bookings
CREATE POLICY "Users can view their own bookings only"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings only"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings only"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookings only"
  ON public.bookings FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all bookings"
  ON public.bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- =============================================================================
-- 5. HOTELS TABLE SECURITY HARDENING
-- =============================================================================

-- Ensure hotels has strict RLS policies
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate with stricter rules
DROP POLICY IF EXISTS "Hotels are viewable by everyone" ON public.hotels;

-- Strict RLS policies for hotels
CREATE POLICY "Hotels are viewable by authenticated users"
  ON public.hotels FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can create hotels"
  ON public.hotels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update hotels"
  ON public.hotels FOR UPDATE
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

CREATE POLICY "Only admins can delete hotels"
  ON public.hotels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- =============================================================================
-- 6. TOURS TABLE SECURITY HARDENING
-- =============================================================================

-- Ensure tours has strict RLS policies
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate with stricter rules
DROP POLICY IF EXISTS "Tours are viewable by everyone" ON public.tours;

-- Strict RLS policies for tours
CREATE POLICY "Tours are viewable by authenticated users"
  ON public.tours FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can create tours"
  ON public.tours FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update tours"
  ON public.tours FOR UPDATE
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

CREATE POLICY "Only admins can delete tours"
  ON public.tours FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- =============================================================================
-- 7. FLIGHTS TABLE SECURITY HARDENING
-- =============================================================================

-- Ensure flights has strict RLS policies
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate with stricter rules
DROP POLICY IF EXISTS "Flights are viewable by everyone" ON public.flights;

-- Strict RLS policies for flights
CREATE POLICY "Flights are viewable by authenticated users"
  ON public.flights FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can create flights"
  ON public.flights FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update flights"
  ON public.flights FOR UPDATE
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

CREATE POLICY "Only admins can delete flights"
  ON public.flights FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- =============================================================================
-- 8. REVIEWS TABLE SECURITY HARDENING
-- =============================================================================

-- Ensure reviews has strict RLS policies
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate with stricter rules
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;

-- Strict RLS policies for reviews
CREATE POLICY "Reviews are viewable by authenticated users"
  ON public.reviews FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own reviews only"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews only"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews only"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews"
  ON public.reviews FOR ALL
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

-- =============================================================================
-- 9. PAYMENT SYSTEM TABLES SECURITY HARDENING
-- =============================================================================

-- Payment orders table security
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own payment orders" ON public.payment_orders;

-- Strict RLS policies for payment_orders
CREATE POLICY "Users can view their own payment orders only"
  ON public.payment_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = payment_orders.booking_id 
      AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create payment orders"
  ON public.payment_orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update payment orders"
  ON public.payment_orders FOR UPDATE
  WITH CHECK (true);

CREATE POLICY "Admins can view all payment orders"
  ON public.payment_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- Payment refunds table security
ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own payment refunds" ON public.payment_refunds;

-- Strict RLS policies for payment_refunds
CREATE POLICY "Users can view their own payment refunds only"
  ON public.payment_refunds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = payment_refunds.booking_id 
      AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create payment refunds"
  ON public.payment_refunds FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update payment refunds"
  ON public.payment_refunds FOR UPDATE
  WITH CHECK (true);

CREATE POLICY "Admins can view all payment refunds"
  ON public.payment_refunds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- Notifications table security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

-- Strict RLS policies for notifications
CREATE POLICY "Users can view their own notifications only"
  ON public.notifications FOR SELECT
  USING (
    recipient = auth.jwt() ->> 'email' OR
    recipient = auth.jwt() ->> 'phone'
  );

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update notifications"
  ON public.notifications FOR UPDATE
  WITH CHECK (true);

CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- Webhook events table security
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Webhook events are viewable by admins only" ON public.webhook_events;

-- Strict RLS policies for webhook_events
CREATE POLICY "Webhook events are viewable by admins only"
  ON public.webhook_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "System can create webhook events"
  ON public.webhook_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update webhook events"
  ON public.webhook_events FOR UPDATE
  WITH CHECK (true);

-- =============================================================================
-- 10. SECURITY TABLES HARDENING
-- =============================================================================

-- Audit logs table security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Audit logs are viewable by admins only" ON public.audit_logs;

-- Strict RLS policies for audit_logs
CREATE POLICY "Audit logs are viewable by admins only"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "System can create audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- Payment tokens table security
ALTER TABLE public.payment_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own payment tokens" ON public.payment_tokens;
DROP POLICY IF EXISTS "Users can create their own payment tokens" ON public.payment_tokens;
DROP POLICY IF EXISTS "Users can update their own payment tokens" ON public.payment_tokens;

-- Strict RLS policies for payment_tokens
CREATE POLICY "Users can view their own payment tokens only"
  ON public.payment_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment tokens only"
  ON public.payment_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment tokens only"
  ON public.payment_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment tokens only"
  ON public.payment_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Fraud detection logs table security
ALTER TABLE public.fraud_detection_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Fraud logs are viewable by admins only" ON public.fraud_detection_logs;
DROP POLICY IF EXISTS "Fraud logs can be inserted by system" ON public.fraud_detection_logs;

-- Strict RLS policies for fraud_detection_logs
CREATE POLICY "Fraud logs are viewable by admins only"
  ON public.fraud_detection_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "System can create fraud logs"
  ON public.fraud_detection_logs FOR INSERT
  WITH CHECK (true);

-- Security events table security
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Security events are viewable by admins only" ON public.security_events;

-- Strict RLS policies for security_events
CREATE POLICY "Security events are viewable by admins only"
  ON public.security_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "System can create security events"
  ON public.security_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update security events"
  ON public.security_events FOR UPDATE
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

-- =============================================================================
-- 11. BOOKING MANAGEMENT TABLES SECURITY HARDENING
-- =============================================================================

-- Booking events table security
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Booking events are viewable by users and admins" ON public.booking_events;
DROP POLICY IF EXISTS "Booking events can be inserted by authenticated users" ON public.booking_events;

-- Strict RLS policies for booking_events
CREATE POLICY "Users can view their own booking events only"
  ON public.booking_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create booking events"
  ON public.booking_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all booking events"
  ON public.booking_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- Booking locks table security
ALTER TABLE public.booking_locks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own booking locks" ON public.booking_locks;
DROP POLICY IF EXISTS "Users can create their own booking locks" ON public.booking_locks;

-- Strict RLS policies for booking_locks
CREATE POLICY "Users can view their own booking locks only"
  ON public.booking_locks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own booking locks only"
  ON public.booking_locks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own booking locks only"
  ON public.booking_locks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own booking locks only"
  ON public.booking_locks FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all booking locks"
  ON public.booking_locks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- =============================================================================
-- 12. REVOKE PUBLIC ACCESS FROM ALL TABLES
-- =============================================================================

-- Revoke all public access from sensitive tables
REVOKE ALL ON public.user_roles FROM PUBLIC;
REVOKE ALL ON public.profiles FROM PUBLIC;
REVOKE ALL ON public.bookings FROM PUBLIC;
REVOKE ALL ON public.payment_orders FROM PUBLIC;
REVOKE ALL ON public.payment_refunds FROM PUBLIC;
REVOKE ALL ON public.payment_tokens FROM PUBLIC;
REVOKE ALL ON public.notifications FROM PUBLIC;
REVOKE ALL ON public.webhook_events FROM PUBLIC;
REVOKE ALL ON public.audit_logs FROM PUBLIC;
REVOKE ALL ON public.fraud_detection_logs FROM PUBLIC;
REVOKE ALL ON public.security_events FROM PUBLIC;
REVOKE ALL ON public.booking_events FROM PUBLIC;
REVOKE ALL ON public.booking_locks FROM PUBLIC;

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================================================
-- 13. CREATE SECURITY FUNCTIONS
-- =============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Function to check if user owns resource
CREATE OR REPLACE FUNCTION public.owns_resource(_user_id uuid, _resource_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id = _resource_user_id OR public.is_admin(_user_id)
$$;

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  _event_type text,
  _severity text,
  _description text,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_id uuid;
BEGIN
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    description,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    auth.uid(),
    _event_type,
    _severity,
    _description,
    inet_client_addr(),
    current_setting('request.headers', true)::jsonb->>'user-agent',
    _metadata
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text,
  _resource_type text,
  _resource_id uuid,
  _old_values jsonb DEFAULT NULL,
  _new_values jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    session_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    current_setting('request.headers', true)::jsonb->>'x-session-id',
    _action,
    _resource_type,
    _resource_id,
    _old_values,
    _new_values,
    inet_client_addr(),
    current_setting('request.headers', true)::jsonb->>'user-agent'
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- =============================================================================
-- 14. CREATE SECURITY TRIGGERS
-- =============================================================================

-- Trigger to log profile changes
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      'CREATE',
      'profile',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_audit_event(
      'UPDATE',
      'profile',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit_event(
      'DELETE',
      'profile',
      OLD.id,
      to_jsonb(OLD),
      NULL
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER profile_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_profile_changes();

-- Trigger to log booking changes
CREATE OR REPLACE FUNCTION public.log_booking_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      'CREATE',
      'booking',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_audit_event(
      'UPDATE',
      'booking',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit_event(
      'DELETE',
      'booking',
      OLD.id,
      to_jsonb(OLD),
      NULL
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER booking_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.log_booking_changes();

-- Trigger to log payment changes
CREATE OR REPLACE FUNCTION public.log_payment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      'CREATE',
      'payment_order',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_audit_event(
      'UPDATE',
      'payment_order',
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER payment_audit_trigger
  AFTER INSERT OR UPDATE ON public.payment_orders
  FOR EACH ROW EXECUTE FUNCTION public.log_payment_changes();

-- =============================================================================
-- 15. CREATE SECURITY VIEWS
-- =============================================================================

-- View for user security summary
CREATE VIEW public.user_security_summary AS
SELECT 
  u.id as user_id,
  u.email,
  ur.role,
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT pt.id) as payment_tokens,
  COUNT(DISTINCT se.id) as security_events,
  MAX(al.created_at) as last_activity,
  CASE 
    WHEN COUNT(DISTINCT se.id) > 5 THEN 'HIGH'
    WHEN COUNT(DISTINCT se.id) > 2 THEN 'MEDIUM'
    ELSE 'LOW'
  END as risk_level
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.bookings b ON u.id = b.user_id
LEFT JOIN public.payment_tokens pt ON u.id = pt.user_id
LEFT JOIN public.security_events se ON u.id = se.user_id
LEFT JOIN public.audit_logs al ON u.id = al.user_id
GROUP BY u.id, u.email, ur.role;

-- Enable RLS on security view
ALTER VIEW public.user_security_summary SET (security_invoker = true);

-- =============================================================================
-- 16. CREATE SECURITY INDEXES
-- =============================================================================

-- Indexes for security-related queries
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id_created_at ON public.audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id_severity ON public.security_events(user_id, severity);
CREATE INDEX IF NOT EXISTS idx_fraud_logs_user_id_created_at ON public.fraud_detection_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_payment_tokens_user_id_expires_at ON public.payment_tokens(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_booking_locks_user_id_expires_at ON public.booking_locks(user_id, expires_at);

-- =============================================================================
-- 17. SECURITY CONFIGURATION
-- =============================================================================

-- Set secure default values
ALTER DATABASE postgres SET log_statement = 'mod';
ALTER DATABASE postgres SET log_min_duration_statement = 1000;
ALTER DATABASE postgres SET log_connections = on;
ALTER DATABASE postgres SET log_disconnections = on;

-- =============================================================================
-- 18. FINAL SECURITY CHECKS
-- =============================================================================

-- Verify all tables have RLS enabled
DO $$
DECLARE
  table_name text;
  tables_without_rls text[] := ARRAY[]::text[];
BEGIN
  FOR table_name IN 
    SELECT schemaname||'.'||tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
      AND c.relname = split_part(table_name, '.', 2)
      AND c.relrowsecurity = true
    ) THEN
      tables_without_rls := array_append(tables_without_rls, table_name);
    END IF;
  END LOOP;
  
  IF array_length(tables_without_rls, 1) > 0 THEN
    RAISE EXCEPTION 'Tables without RLS: %', array_to_string(tables_without_rls, ', ');
  END IF;
END $$;

-- Log completion of security hardening
INSERT INTO public.security_events (
  event_type,
  severity,
  description,
  metadata
) VALUES (
  'security_hardening',
  'low',
  'Database security hardening completed',
  jsonb_build_object(
    'migration_version', '20250122000003',
    'tables_secured', (
      SELECT count(*) FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
    ),
    'policies_created', (
      SELECT count(*) FROM pg_policies 
      WHERE schemaname = 'public'
    )
  )
);
