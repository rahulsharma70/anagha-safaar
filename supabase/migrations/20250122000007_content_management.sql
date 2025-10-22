-- Content Management and Pricing Migration
-- This migration creates tables for pricing/availability management and content analytics

-- =============================================================================
-- 1. CREATE PRICING_AVAILABILITY TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS pricing_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type TEXT NOT NULL CHECK (item_type IN ('hotel', 'tour', 'flight')),
    item_id UUID NOT NULL,
    date DATE NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    availability INTEGER NOT NULL CHECK (availability >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(item_type, item_id, date)
);

-- =============================================================================
-- 2. CREATE INDEXES FOR PRICING_AVAILABILITY
-- =============================================================================

-- Index for item lookups
CREATE INDEX IF NOT EXISTS idx_pricing_availability_item ON pricing_availability(item_type, item_id);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_pricing_availability_date ON pricing_availability(date);

-- Index for active pricing
CREATE INDEX IF NOT EXISTS idx_pricing_availability_active ON pricing_availability(is_active) WHERE is_active = TRUE;

-- Index for availability queries
CREATE INDEX IF NOT EXISTS idx_pricing_availability_availability ON pricing_availability(availability);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_pricing_availability_composite ON pricing_availability(item_type, item_id, date, is_active);

-- =============================================================================
-- 3. CREATE CONTENT_ANALYTICS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS content_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL CHECK (content_type IN ('hotel', 'tour', 'flight')),
    content_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Analytics data
    views_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    bookings_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    
    -- User interactions
    last_viewed_at TIMESTAMPTZ,
    last_clicked_at TIMESTAMPTZ,
    last_booked_at TIMESTAMPTZ,
    last_liked_at TIMESTAMPTZ,
    last_shared_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(content_type, content_id, user_id)
);

-- =============================================================================
-- 4. CREATE INDEXES FOR CONTENT_ANALYTICS
-- =============================================================================

-- Index for content lookups
CREATE INDEX IF NOT EXISTS idx_content_analytics_content ON content_analytics(content_type, content_id);

-- Index for user analytics
CREATE INDEX IF NOT EXISTS idx_content_analytics_user ON content_analytics(user_id);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_content_analytics_dates ON content_analytics(created_at, updated_at);

-- =============================================================================
-- 5. CREATE CONTENT_MODERATION TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS content_moderation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL CHECK (content_type IN ('hotel', 'tour', 'flight')),
    content_id UUID NOT NULL,
    moderator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Moderation data
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    reason TEXT,
    notes TEXT,
    action_taken TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    moderated_at TIMESTAMPTZ
);

-- =============================================================================
-- 6. CREATE INDEXES FOR CONTENT_MODERATION
-- =============================================================================

-- Index for content moderation lookups
CREATE INDEX IF NOT EXISTS idx_content_moderation_content ON content_moderation(content_type, content_id);

-- Index for moderator queries
CREATE INDEX IF NOT EXISTS idx_content_moderation_moderator ON content_moderation(moderator_id);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_content_moderation_status ON content_moderation(status);

-- =============================================================================
-- 7. CREATE UPDATED_AT TRIGGERS
-- =============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_management_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for all tables
CREATE TRIGGER trigger_update_pricing_availability_updated_at
    BEFORE UPDATE ON pricing_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_content_management_updated_at();

CREATE TRIGGER trigger_update_content_analytics_updated_at
    BEFORE UPDATE ON content_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_content_management_updated_at();

CREATE TRIGGER trigger_update_content_moderation_updated_at
    BEFORE UPDATE ON content_moderation
    FOR EACH ROW
    EXECUTE FUNCTION update_content_management_updated_at();

-- =============================================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE pricing_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation ENABLE ROW LEVEL SECURITY;

-- Pricing availability policies
CREATE POLICY "Admins can manage pricing" ON pricing_availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can view active pricing" ON pricing_availability
    FOR SELECT USING (is_active = TRUE);

-- Content analytics policies
CREATE POLICY "Users can view own analytics" ON content_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics" ON content_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can insert own analytics" ON content_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analytics" ON content_analytics
    FOR UPDATE USING (auth.uid() = user_id);

-- Content moderation policies
CREATE POLICY "Moderators can manage content moderation" ON content_moderation
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin', 'content_moderator')
        )
    );

-- =============================================================================
-- 7. CREATE HELPER FUNCTIONS
-- =============================================================================

-- Function to get pricing for a specific date range
CREATE OR REPLACE FUNCTION get_pricing_for_date_range(
    item_type_param TEXT,
    item_id_param UUID,
    start_date_param DATE,
    end_date_param DATE
)
RETURNS TABLE (
    date DATE,
    price DECIMAL(10,2),
    availability INTEGER,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pa.date,
        pa.price,
        pa.availability,
        pa.is_active
    FROM pricing_availability pa
    WHERE 
        pa.item_type = item_type_param
        AND pa.item_id = item_id_param
        AND pa.date >= start_date_param
        AND pa.date <= end_date_param
        AND pa.is_active = TRUE
    ORDER BY pa.date;
END;
$$ LANGUAGE plpgsql;

-- Function to update content analytics
CREATE OR REPLACE FUNCTION update_content_analytics(
    content_type_param TEXT,
    content_id_param UUID,
    user_id_param UUID,
    action_param TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO content_analytics (
        content_type,
        content_id,
        user_id,
        views_count,
        clicks_count,
        bookings_count,
        likes_count,
        shares_count,
        last_viewed_at,
        last_clicked_at,
        last_booked_at,
        last_liked_at,
        last_shared_at
    ) VALUES (
        content_type_param,
        content_id_param,
        user_id_param,
        CASE WHEN action_param = 'view' THEN 1 ELSE 0 END,
        CASE WHEN action_param = 'click' THEN 1 ELSE 0 END,
        CASE WHEN action_param = 'booking' THEN 1 ELSE 0 END,
        CASE WHEN action_param = 'like' THEN 1 ELSE 0 END,
        CASE WHEN action_param = 'share' THEN 1 ELSE 0 END,
        CASE WHEN action_param = 'view' THEN NOW() ELSE NULL END,
        CASE WHEN action_param = 'click' THEN NOW() ELSE NULL END,
        CASE WHEN action_param = 'booking' THEN NOW() ELSE NULL END,
        CASE WHEN action_param = 'like' THEN NOW() ELSE NULL END,
        CASE WHEN action_param = 'share' THEN NOW() ELSE NULL END
    )
    ON CONFLICT (content_type, content_id, user_id)
    DO UPDATE SET
        views_count = content_analytics.views_count + CASE WHEN action_param = 'view' THEN 1 ELSE 0 END,
        clicks_count = content_analytics.clicks_count + CASE WHEN action_param = 'click' THEN 1 ELSE 0 END,
        bookings_count = content_analytics.bookings_count + CASE WHEN action_param = 'booking' THEN 1 ELSE 0 END,
        likes_count = content_analytics.likes_count + CASE WHEN action_param = 'like' THEN 1 ELSE 0 END,
        shares_count = content_analytics.shares_count + CASE WHEN action_param = 'share' THEN 1 ELSE 0 END,
        last_viewed_at = CASE WHEN action_param = 'view' THEN NOW() ELSE content_analytics.last_viewed_at END,
        last_clicked_at = CASE WHEN action_param = 'click' THEN NOW() ELSE content_analytics.last_clicked_at END,
        last_booked_at = CASE WHEN action_param = 'booking' THEN NOW() ELSE content_analytics.last_booked_at END,
        last_liked_at = CASE WHEN action_param = 'like' THEN NOW() ELSE content_analytics.last_liked_at END,
        last_shared_at = CASE WHEN action_param = 'share' THEN NOW() ELSE content_analytics.last_shared_at END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get content statistics
CREATE OR REPLACE FUNCTION get_content_statistics(
    content_type_param TEXT DEFAULT NULL,
    start_date_param DATE DEFAULT NULL,
    end_date_param DATE DEFAULT NULL
)
RETURNS TABLE (
    content_type TEXT,
    total_items INTEGER,
    active_items INTEGER,
    featured_items INTEGER,
    total_views BIGINT,
    total_bookings BIGINT,
    average_price DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(content_type_param, 'all') as content_type,
        COUNT(*)::INTEGER as total_items,
        COUNT(*) FILTER (WHERE is_active = TRUE)::INTEGER as active_items,
        COUNT(*) FILTER (WHERE is_featured = TRUE)::INTEGER as featured_items,
        COALESCE(SUM(ca.views_count), 0)::BIGINT as total_views,
        COALESCE(SUM(ca.bookings_count), 0)::BIGINT as total_bookings,
        COALESCE(AVG(pa.price), 0)::DECIMAL(10,2) as average_price
    FROM (
        SELECT 'hotel' as content_type, id, is_active, is_featured FROM hotels
        UNION ALL
        SELECT 'tour' as content_type, id, is_active, is_featured FROM tours
        UNION ALL
        SELECT 'flight' as content_type, id, is_active, is_featured FROM flights
    ) content
    LEFT JOIN content_analytics ca ON ca.content_type = content.content_type AND ca.content_id = content.id
    LEFT JOIN pricing_availability pa ON pa.item_type = content.content_type AND pa.item_id = content.id
    WHERE 
        (content_type_param IS NULL OR content.content_type = content_type_param)
        AND (start_date_param IS NULL OR pa.date >= start_date_param)
        AND (end_date_param IS NULL OR pa.date <= end_date_param)
    GROUP BY content.content_type;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 8. CREATE VIEWS FOR COMMON QUERIES
-- =============================================================================

-- View for active pricing
CREATE OR REPLACE VIEW active_pricing AS
SELECT 
    pa.item_type,
    pa.item_id,
    pa.date,
    pa.price,
    pa.availability,
    pa.is_active,
    pa.created_at,
    pa.updated_at
FROM pricing_availability pa
WHERE pa.is_active = TRUE;

-- View for content performance
CREATE OR REPLACE VIEW content_performance AS
SELECT 
    ca.content_type,
    ca.content_id,
    SUM(ca.views_count) as total_views,
    SUM(ca.clicks_count) as total_clicks,
    SUM(ca.bookings_count) as total_bookings,
    SUM(ca.likes_count) as total_likes,
    SUM(ca.shares_count) as total_shares,
    MAX(ca.last_viewed_at) as last_viewed,
    MAX(ca.last_booked_at) as last_booked
FROM content_analytics ca
GROUP BY ca.content_type, ca.content_id;

-- View for moderation queue
CREATE OR REPLACE VIEW moderation_queue AS
SELECT 
    cm.id,
    cm.content_type,
    cm.content_id,
    cm.status,
    cm.reason,
    cm.notes,
    cm.created_at,
    cm.moderated_at,
    p.first_name as moderator_name,
    p.last_name as moderator_last_name
FROM content_moderation cm
LEFT JOIN profiles p ON cm.moderator_id = p.id
WHERE cm.status = 'pending'
ORDER BY cm.created_at ASC;

-- =============================================================================
-- 9. GRANT PERMISSIONS
-- =============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON pricing_availability TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON content_analytics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON content_moderation TO authenticated;

-- Grant permissions to anon users for public data
GRANT SELECT ON active_pricing TO anon;
GRANT SELECT ON content_performance TO anon;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================================================
-- 10. COMMENTS
-- =============================================================================

COMMENT ON TABLE pricing_availability IS 'Stores dynamic pricing and availability for hotels, tours, and flights';
COMMENT ON COLUMN pricing_availability.item_type IS 'Type of content: hotel, tour, or flight';
COMMENT ON COLUMN pricing_availability.item_id IS 'ID of the specific hotel, tour, or flight';
COMMENT ON COLUMN pricing_availability.date IS 'Date for which pricing/availability applies';
COMMENT ON COLUMN pricing_availability.price IS 'Price for the specific date';
COMMENT ON COLUMN pricing_availability.availability IS 'Number of available units (rooms, seats, spots)';

COMMENT ON TABLE content_analytics IS 'Tracks user interactions and analytics for content items';
COMMENT ON TABLE content_moderation IS 'Manages content moderation workflow and approvals';

COMMENT ON FUNCTION get_pricing_for_date_range IS 'Retrieves pricing and availability for a specific date range';
COMMENT ON FUNCTION update_content_analytics IS 'Updates analytics counters for user interactions';
COMMENT ON FUNCTION get_content_statistics IS 'Returns comprehensive statistics for content performance';
