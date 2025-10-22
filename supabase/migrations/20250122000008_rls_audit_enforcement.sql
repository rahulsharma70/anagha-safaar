-- Comprehensive RLS Audit and Enforcement Migration
-- This migration audits all tables, enforces strict RLS policies, and creates SECURITY DEFINER functions for admin role management

-- =============================================================================
-- 1. AUDIT ALL EXISTING TABLES AND THEIR RLS STATUS
-- =============================================================================

-- Create a function to audit RLS status across all tables
CREATE OR REPLACE FUNCTION audit_rls_status()
RETURNS TABLE (
    table_name TEXT,
    rls_enabled BOOLEAN,
    policy_count INTEGER,
    policies TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        t.row_security::BOOLEAN as rls_enabled,
        COUNT(p.policyname)::INTEGER as policy_count,
        ARRAY_AGG(p.policyname) as policies
    FROM information_schema.tables t
    LEFT JOIN pg_policies p ON t.table_name = p.tablename AND p.schemaname = 'public'
    WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name NOT LIKE 'sql_%'
    GROUP BY t.table_name, t.row_security
    ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 2. CREATE SECURITY DEFINER FUNCTIONS FOR ROLE MANAGEMENT
-- =============================================================================

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    );
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(_user_id, 'admin');
$$;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(_user_id, 'super_admin');
$$;

-- Function to check if user is content moderator
CREATE OR REPLACE FUNCTION public.is_content_moderator(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(_user_id, 'content_moderator');
$$;

-- Function to check if user has any admin privileges
CREATE OR REPLACE FUNCTION public.has_admin_privileges(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role IN ('admin', 'super_admin', 'content_moderator')
    );
$$;

-- =============================================================================
-- 3. SECURE ROLE MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function to assign role (admin only)
CREATE OR REPLACE FUNCTION public.assign_role(
    _target_user_id UUID,
    _role TEXT,
    _assigned_by UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _assigned_by_role TEXT;
BEGIN
    -- Check if assigner has admin privileges
    IF NOT public.has_admin_privileges(_assigned_by) THEN
        RAISE EXCEPTION 'Insufficient privileges to assign roles';
    END IF;

    -- Get assigner's role for audit
    SELECT role INTO _assigned_by_role
    FROM public.user_roles
    WHERE user_id = _assigned_by
    LIMIT 1;

    -- Insert or update role
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (_target_user_id, _role, NOW())
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Log the role assignment
    INSERT INTO public.audit_logs (
        table_name,
        operation,
        user_id,
        details,
        ip_address,
        user_agent
    ) VALUES (
        'user_roles',
        'INSERT',
        _assigned_by,
        jsonb_build_object(
            'target_user_id', _target_user_id,
            'assigned_role', _role,
            'assigned_by_role', _assigned_by_role,
            'timestamp', NOW()
        ),
        NULL,
        NULL
    );

    RETURN TRUE;
END;
$$;

-- Function to revoke role (admin only)
CREATE OR REPLACE FUNCTION public.revoke_role(
    _target_user_id UUID,
    _role TEXT,
    _revoked_by UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _revoked_by_role TEXT;
BEGIN
    -- Check if revoker has admin privileges
    IF NOT public.has_admin_privileges(_revoked_by) THEN
        RAISE EXCEPTION 'Insufficient privileges to revoke roles';
    END IF;

    -- Prevent self-revocation of admin role
    IF _target_user_id = _revoked_by AND _role = 'admin' THEN
        RAISE EXCEPTION 'Cannot revoke your own admin role';
    END IF;

    -- Get revoker's role for audit
    SELECT role INTO _revoked_by_role
    FROM public.user_roles
    WHERE user_id = _revoked_by
    LIMIT 1;

    -- Delete the role
    DELETE FROM public.user_roles
    WHERE user_id = _target_user_id AND role = _role;

    -- Log the role revocation
    INSERT INTO public.audit_logs (
        table_name,
        operation,
        user_id,
        details,
        ip_address,
        user_agent
    ) VALUES (
        'user_roles',
        'DELETE',
        _revoked_by,
        jsonb_build_object(
            'target_user_id', _target_user_id,
            'revoked_role', _role,
            'revoked_by_role', _revoked_by_role,
            'timestamp', NOW()
        ),
        NULL,
        NULL
    );

    RETURN TRUE;
END;
$$;

-- Function to list user roles (admin only)
CREATE OR REPLACE FUNCTION public.list_user_roles(_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
    user_id UUID,
    roles TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if requester has admin privileges
    IF NOT public.has_admin_privileges(_user_id) THEN
        RAISE EXCEPTION 'Insufficient privileges to list user roles';
    END IF;

    RETURN QUERY
    SELECT 
        ur.user_id,
        ARRAY_AGG(ur.role) as roles
    FROM public.user_roles ur
    GROUP BY ur.user_id
    ORDER BY ur.user_id;
END;
$$;

-- =============================================================================
-- 4. ENFORCE STRICT RLS POLICIES ON ALL SENSITIVE TABLES
-- =============================================================================

-- =============================================================================
-- 4.1 USER_ROLES TABLE - STRICTEST SECURITY
-- =============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own roles only" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;

-- Ensure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Block all direct operations - only allow through SECURITY DEFINER functions
CREATE POLICY "Block all direct operations on user_roles"
    ON public.user_roles FOR ALL
    USING (FALSE)
    WITH CHECK (FALSE);

-- =============================================================================
-- 4.2 PROFILES TABLE - STRICT USER-ONLY ACCESS
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Strict policies for profiles
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
    USING (public.has_admin_privileges());

-- =============================================================================
-- 4.3 BOOKINGS TABLE - STRICT USER/ADMIN ACCESS
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own bookings only" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings only" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings only" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings only" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;

-- Ensure RLS is enabled
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Strict policies for bookings
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
    USING (public.has_admin_privileges());

CREATE POLICY "Admins can update all bookings"
    ON public.bookings FOR UPDATE
    USING (public.has_admin_privileges());

-- =============================================================================
-- 4.4 PAYMENTS TABLE - STRICT USER/ADMIN ACCESS
-- =============================================================================

-- Ensure payments table exists and has RLS enabled
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create their own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;

-- Strict policies for payments
CREATE POLICY "Users can view their own payments only"
    ON public.payments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments only"
    ON public.payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
    ON public.payments FOR SELECT
    USING (public.has_admin_privileges());

CREATE POLICY "Admins can update all payments"
    ON public.payments FOR UPDATE
    USING (public.has_admin_privileges());

-- =============================================================================
-- 4.5 HOTELS TABLE - ADMIN-ONLY MODIFICATION
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Hotels are viewable by authenticated users" ON public.hotels;
DROP POLICY IF EXISTS "Only admins can create hotels" ON public.hotels;
DROP POLICY IF EXISTS "Only admins can update hotels" ON public.hotels;
DROP POLICY IF EXISTS "Only admins can delete hotels" ON public.hotels;

-- Ensure RLS is enabled
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

-- Strict policies for hotels
CREATE POLICY "Hotels are viewable by authenticated users"
    ON public.hotels FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can create hotels"
    ON public.hotels FOR INSERT
    WITH CHECK (public.has_admin_privileges());

CREATE POLICY "Only admins can update hotels"
    ON public.hotels FOR UPDATE
    USING (public.has_admin_privileges());

CREATE POLICY "Only admins can delete hotels"
    ON public.hotels FOR DELETE
    USING (public.has_admin_privileges());

-- =============================================================================
-- 4.6 TOURS TABLE - ADMIN-ONLY MODIFICATION
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Tours are viewable by authenticated users" ON public.tours;
DROP POLICY IF EXISTS "Only admins can create tours" ON public.tours;
DROP POLICY IF EXISTS "Only admins can update tours" ON public.tours;
DROP POLICY IF EXISTS "Only admins can delete tours" ON public.tours;

-- Ensure RLS is enabled
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

-- Strict policies for tours
CREATE POLICY "Tours are viewable by authenticated users"
    ON public.tours FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can create tours"
    ON public.tours FOR INSERT
    WITH CHECK (public.has_admin_privileges());

CREATE POLICY "Only admins can update tours"
    ON public.tours FOR UPDATE
    USING (public.has_admin_privileges());

CREATE POLICY "Only admins can delete tours"
    ON public.tours FOR DELETE
    USING (public.has_admin_privileges());

-- =============================================================================
-- 4.7 FLIGHTS TABLE - ADMIN-ONLY MODIFICATION
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Flights are viewable by authenticated users" ON public.flights;
DROP POLICY IF EXISTS "Only admins can create flights" ON public.flights;
DROP POLICY IF EXISTS "Only admins can update flights" ON public.flights;
DROP POLICY IF EXISTS "Only admins can delete flights" ON public.flights;

-- Ensure RLS is enabled
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;

-- Strict policies for flights
CREATE POLICY "Flights are viewable by authenticated users"
    ON public.flights FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can create flights"
    ON public.flights FOR INSERT
    WITH CHECK (public.has_admin_privileges());

CREATE POLICY "Only admins can update flights"
    ON public.flights FOR UPDATE
    USING (public.has_admin_privileges());

CREATE POLICY "Only admins can delete flights"
    ON public.flights FOR DELETE
    USING (public.has_admin_privileges());

-- =============================================================================
-- 4.8 PRICING_AVAILABILITY TABLE - ADMIN-ONLY MODIFICATION
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage pricing" ON public.pricing_availability;
DROP POLICY IF EXISTS "Users can view active pricing" ON public.pricing_availability;

-- Ensure RLS is enabled
ALTER TABLE public.pricing_availability ENABLE ROW LEVEL SECURITY;

-- Strict policies for pricing
CREATE POLICY "Admins can manage pricing"
    ON public.pricing_availability FOR ALL
    USING (public.has_admin_privileges())
    WITH CHECK (public.has_admin_privileges());

CREATE POLICY "Users can view active pricing"
    ON public.pricing_availability FOR SELECT
    USING (is_active = TRUE);

-- =============================================================================
-- 4.9 CONTENT_ANALYTICS TABLE - USER/ADMIN ACCESS
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own analytics" ON public.content_analytics;
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.content_analytics;
DROP POLICY IF EXISTS "Users can insert own analytics" ON public.content_analytics;
DROP POLICY IF EXISTS "Users can update own analytics" ON public.content_analytics;

-- Ensure RLS is enabled
ALTER TABLE public.content_analytics ENABLE ROW LEVEL SECURITY;

-- Strict policies for analytics
CREATE POLICY "Users can view own analytics"
    ON public.content_analytics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics"
    ON public.content_analytics FOR SELECT
    USING (public.has_admin_privileges());

CREATE POLICY "Users can insert own analytics"
    ON public.content_analytics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics"
    ON public.content_analytics FOR UPDATE
    USING (auth.uid() = user_id);

-- =============================================================================
-- 4.10 CONTENT_MODERATION TABLE - MODERATOR/ADMIN ACCESS
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Moderators can manage content moderation" ON public.content_moderation;

-- Ensure RLS is enabled
ALTER TABLE public.content_moderation ENABLE ROW LEVEL SECURITY;

-- Strict policies for moderation
CREATE POLICY "Moderators can manage content moderation"
    ON public.content_moderation FOR ALL
    USING (public.has_admin_privileges() OR public.is_content_moderator())
    WITH CHECK (public.has_admin_privileges() OR public.is_content_moderator());

-- =============================================================================
-- 4.11 AI_ITINERARIES TABLE - USER/ADMIN ACCESS
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own itineraries" ON public.ai_itineraries;
DROP POLICY IF EXISTS "Anyone can view public itineraries" ON public.ai_itineraries;
DROP POLICY IF EXISTS "Users can insert own itineraries" ON public.ai_itineraries;
DROP POLICY IF EXISTS "Users can update own itineraries" ON public.ai_itineraries;
DROP POLICY IF EXISTS "Users can delete own itineraries" ON public.ai_itineraries;

-- Ensure RLS is enabled
ALTER TABLE public.ai_itineraries ENABLE ROW LEVEL SECURITY;

-- Strict policies for AI itineraries
CREATE POLICY "Users can view own itineraries"
    ON public.ai_itineraries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public itineraries"
    ON public.ai_itineraries FOR SELECT
    USING (is_public = TRUE);

CREATE POLICY "Users can insert own itineraries"
    ON public.ai_itineraries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own itineraries"
    ON public.ai_itineraries FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own itineraries"
    ON public.ai_itineraries FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all itineraries"
    ON public.ai_itineraries FOR SELECT
    USING (public.has_admin_privileges());

-- =============================================================================
-- 5. REVOKE ALL PUBLIC ACCESS FROM SENSITIVE TABLES
-- =============================================================================

-- Revoke all public access from sensitive tables
REVOKE ALL ON public.user_roles FROM PUBLIC;
REVOKE ALL ON public.profiles FROM PUBLIC;
REVOKE ALL ON public.bookings FROM PUBLIC;
REVOKE ALL ON public.payments FROM PUBLIC;
REVOKE ALL ON public.hotels FROM PUBLIC;
REVOKE ALL ON public.tours FROM PUBLIC;
REVOKE ALL ON public.flights FROM PUBLIC;
REVOKE ALL ON public.pricing_availability FROM PUBLIC;
REVOKE ALL ON public.content_analytics FROM PUBLIC;
REVOKE ALL ON public.content_moderation FROM PUBLIC;
REVOKE ALL ON public.ai_itineraries FROM PUBLIC;
REVOKE ALL ON public.ai_itinerary_analytics FROM PUBLIC;
REVOKE ALL ON public.ai_itinerary_feedback FROM PUBLIC;

-- Revoke access from sensitive audit and security tables
REVOKE ALL ON public.audit_logs FROM PUBLIC;
REVOKE ALL ON public.security_events FROM PUBLIC;
REVOKE ALL ON public.fraud_detection_logs FROM PUBLIC;
REVOKE ALL ON public.payment_tokens FROM PUBLIC;
REVOKE ALL ON public.personal_data_inventory FROM PUBLIC;

-- =============================================================================
-- 6. GRANT NECESSARY PERMISSIONS TO AUTHENTICATED USERS
-- =============================================================================

-- Grant basic permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================================================
-- 7. CREATE AUDIT TRIGGER FOR ROLE CHANGES
-- =============================================================================

-- Function to audit role changes
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Log role changes
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (
            table_name,
            operation,
            user_id,
            details,
            ip_address,
            user_agent
        ) VALUES (
            'user_roles',
            'INSERT',
            NEW.user_id,
            jsonb_build_object(
                'role', NEW.role,
                'created_at', NEW.created_at
            ),
            NULL,
            NULL
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (
            table_name,
            operation,
            user_id,
            details,
            ip_address,
            user_agent
        ) VALUES (
            'user_roles',
            'DELETE',
            OLD.user_id,
            jsonb_build_object(
                'role', OLD.role,
                'deleted_at', NOW()
            ),
            NULL,
            NULL
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Create trigger for role changes
DROP TRIGGER IF EXISTS audit_role_changes_trigger ON public.user_roles;
CREATE TRIGGER audit_role_changes_trigger
    AFTER INSERT OR DELETE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_role_changes();

-- =============================================================================
-- 8. CREATE SECURITY MONITORING FUNCTIONS
-- =============================================================================

-- Function to check for suspicious activity
CREATE OR REPLACE FUNCTION public.check_suspicious_activity()
RETURNS TABLE (
    user_id UUID,
    activity_count INTEGER,
    last_activity TIMESTAMPTZ,
    suspicious_indicators TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.user_id,
        COUNT(*)::INTEGER as activity_count,
        MAX(al.created_at) as last_activity,
        ARRAY_AGG(DISTINCT al.operation) as suspicious_indicators
    FROM public.audit_logs al
    WHERE al.created_at > NOW() - INTERVAL '1 hour'
    GROUP BY al.user_id
    HAVING COUNT(*) > 100  -- More than 100 operations in 1 hour
    ORDER BY activity_count DESC;
END;
$$;

-- Function to get security summary
CREATE OR REPLACE FUNCTION public.get_security_summary()
RETURNS TABLE (
    total_users INTEGER,
    admin_users INTEGER,
    super_admin_users INTEGER,
    moderator_users INTEGER,
    recent_role_changes INTEGER,
    failed_auth_attempts INTEGER,
    suspicious_activities INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM auth.users) as total_users,
        (SELECT COUNT(*)::INTEGER FROM public.user_roles WHERE role = 'admin') as admin_users,
        (SELECT COUNT(*)::INTEGER FROM public.user_roles WHERE role = 'super_admin') as super_admin_users,
        (SELECT COUNT(*)::INTEGER FROM public.user_roles WHERE role = 'content_moderator') as moderator_users,
        (SELECT COUNT(*)::INTEGER FROM public.audit_logs WHERE table_name = 'user_roles' AND created_at > NOW() - INTERVAL '24 hours') as recent_role_changes,
        (SELECT COUNT(*)::INTEGER FROM public.security_events WHERE event_type = 'failed_auth' AND created_at > NOW() - INTERVAL '24 hours') as failed_auth_attempts,
        (SELECT COUNT(*)::INTEGER FROM public.check_suspicious_activity()) as suspicious_activities;
END;
$$;

-- =============================================================================
-- 9. COMMENTS AND DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION public.has_role IS 'SECURITY DEFINER function to check if user has specific role';
COMMENT ON FUNCTION public.is_admin IS 'SECURITY DEFINER function to check if user is admin';
COMMENT ON FUNCTION public.is_super_admin IS 'SECURITY DEFINER function to check if user is super admin';
COMMENT ON FUNCTION public.is_content_moderator IS 'SECURITY DEFINER function to check if user is content moderator';
COMMENT ON FUNCTION public.has_admin_privileges IS 'SECURITY DEFINER function to check if user has any admin privileges';
COMMENT ON FUNCTION public.assign_role IS 'SECURITY DEFINER function to assign roles (admin only)';
COMMENT ON FUNCTION public.revoke_role IS 'SECURITY DEFINER function to revoke roles (admin only)';
COMMENT ON FUNCTION public.list_user_roles IS 'SECURITY DEFINER function to list user roles (admin only)';
COMMENT ON FUNCTION public.audit_rls_status IS 'Function to audit RLS status across all tables';
COMMENT ON FUNCTION public.check_suspicious_activity IS 'Function to check for suspicious user activity';
COMMENT ON FUNCTION public.get_security_summary IS 'Function to get comprehensive security summary';

-- =============================================================================
-- 10. FINAL SECURITY VERIFICATION
-- =============================================================================

-- Verify all tables have RLS enabled
DO $$
DECLARE
    table_record RECORD;
    rls_disabled_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE 'pg_%'
        AND table_name NOT LIKE 'sql_%'
    LOOP
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public'
            AND c.relname = table_record.table_name
            AND c.relrowsecurity = true
        ) THEN
            rls_disabled_tables := array_append(rls_disabled_tables, table_record.table_name);
        END IF;
    END LOOP;
    
    IF array_length(rls_disabled_tables, 1) > 0 THEN
        RAISE WARNING 'Tables without RLS enabled: %', array_to_string(rls_disabled_tables, ', ');
    ELSE
        RAISE NOTICE 'All tables have RLS enabled successfully';
    END IF;
END $$;
