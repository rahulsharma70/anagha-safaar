-- AI Itineraries Migration
-- This migration creates the ai_itineraries table for storing AI-generated travel itineraries

-- =============================================================================
-- 1. CREATE AI_ITINERARIES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_itineraries (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    destination TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    duration INTEGER NOT NULL CHECK (duration > 0),
    travelers INTEGER NOT NULL CHECK (travelers > 0 AND travelers <= 20),
    
    -- Budget information
    budget_min DECIMAL(10,2) NOT NULL CHECK (budget_min >= 0),
    budget_max DECIMAL(10,2) NOT NULL CHECK (budget_max >= 0),
    budget_currency TEXT NOT NULL DEFAULT 'INR',
    budget_estimated_total DECIMAL(10,2) CHECK (budget_estimated_total >= 0),
    
    -- Travel preferences
    interests TEXT[] NOT NULL DEFAULT '{}',
    travel_style TEXT NOT NULL DEFAULT 'moderate',
    accommodation_type TEXT NOT NULL DEFAULT 'mid_range',
    
    -- AI-generated itinerary data (stored as JSONB for flexibility)
    itinerary_data JSONB NOT NULL DEFAULT '{}',
    
    -- AI provider information
    ai_provider TEXT NOT NULL DEFAULT 'openai',
    processing_time INTEGER DEFAULT 0, -- Processing time in milliseconds
    
    -- Metadata
    is_public BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. CREATE INDEXES
-- =============================================================================

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_ai_itineraries_user_id ON ai_itineraries(user_id);

-- Index for destination searches
CREATE INDEX IF NOT EXISTS idx_ai_itineraries_destination ON ai_itineraries USING GIN (to_tsvector('english', destination));

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_ai_itineraries_dates ON ai_itineraries(start_date, end_date);

-- Index for public itineraries
CREATE INDEX IF NOT EXISTS idx_ai_itineraries_public ON ai_itineraries(is_public) WHERE is_public = TRUE;

-- Index for AI provider queries
CREATE INDEX IF NOT EXISTS idx_ai_itineraries_ai_provider ON ai_itineraries(ai_provider);

-- Index for budget range queries
CREATE INDEX IF NOT EXISTS idx_ai_itineraries_budget ON ai_itineraries(budget_min, budget_max);

-- Index for interests (GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_ai_itineraries_interests ON ai_itineraries USING GIN (interests);

-- Index for tags (GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_ai_itineraries_tags ON ai_itineraries USING GIN (tags);

-- Index for itinerary data JSONB queries
CREATE INDEX IF NOT EXISTS idx_ai_itineraries_data ON ai_itineraries USING GIN (itinerary_data);

-- =============================================================================
-- 3. CREATE UPDATED_AT TRIGGER
-- =============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_itineraries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_ai_itineraries_updated_at
    BEFORE UPDATE ON ai_itineraries
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_itineraries_updated_at();

-- =============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS
ALTER TABLE ai_itineraries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own itineraries
CREATE POLICY "Users can view own itineraries" ON ai_itineraries
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can view public itineraries
CREATE POLICY "Anyone can view public itineraries" ON ai_itineraries
    FOR SELECT USING (is_public = TRUE);

-- Policy: Users can insert their own itineraries
CREATE POLICY "Users can insert own itineraries" ON ai_itineraries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own itineraries
CREATE POLICY "Users can update own itineraries" ON ai_itineraries
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own itineraries
CREATE POLICY "Users can delete own itineraries" ON ai_itineraries
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- 5. CREATE AI ITINERARY ANALYTICS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_itinerary_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id TEXT NOT NULL REFERENCES ai_itineraries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Analytics data
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    bookings_count INTEGER DEFAULT 0,
    
    -- User interactions
    last_viewed_at TIMESTAMPTZ,
    last_liked_at TIMESTAMPTZ,
    last_shared_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_ai_itinerary_analytics_itinerary_id ON ai_itinerary_analytics(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_ai_itinerary_analytics_user_id ON ai_itinerary_analytics(user_id);

-- RLS for analytics
ALTER TABLE ai_itinerary_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics for own itineraries" ON ai_itinerary_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert analytics for own itineraries" ON ai_itinerary_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update analytics for own itineraries" ON ai_itinerary_analytics
    FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================================
-- 6. CREATE AI ITINERARY FEEDBACK TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_itinerary_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id TEXT NOT NULL REFERENCES ai_itineraries(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Feedback data
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    feedback_type TEXT CHECK (feedback_type IN ('positive', 'negative', 'suggestion', 'bug_report')),
    
    -- Specific feedback categories
    accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
    usefulness_rating INTEGER CHECK (usefulness_rating >= 1 AND usefulness_rating <= 5),
    cost_accuracy_rating INTEGER CHECK (cost_accuracy_rating >= 1 AND cost_accuracy_rating <= 5),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for feedback
CREATE INDEX IF NOT EXISTS idx_ai_itinerary_feedback_itinerary_id ON ai_itinerary_feedback(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_ai_itinerary_feedback_user_id ON ai_itinerary_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_itinerary_feedback_rating ON ai_itinerary_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_ai_itinerary_feedback_type ON ai_itinerary_feedback(feedback_type);

-- RLS for feedback
ALTER TABLE ai_itinerary_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view feedback for own itineraries" ON ai_itinerary_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert feedback for own itineraries" ON ai_itinerary_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update feedback for own itineraries" ON ai_itinerary_feedback
    FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================================
-- 7. CREATE HELPER FUNCTIONS
-- =============================================================================

-- Function to get itinerary statistics
CREATE OR REPLACE FUNCTION get_itinerary_stats(itinerary_id_param TEXT)
RETURNS TABLE (
    total_views INTEGER,
    total_likes INTEGER,
    total_shares INTEGER,
    total_bookings INTEGER,
    average_rating DECIMAL(3,2),
    total_feedback INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(analytics.views_count, 0)::INTEGER as total_views,
        COALESCE(analytics.likes_count, 0)::INTEGER as total_likes,
        COALESCE(analytics.shares_count, 0)::INTEGER as total_shares,
        COALESCE(analytics.bookings_count, 0)::INTEGER as total_bookings,
        COALESCE(feedback_stats.avg_rating, 0)::DECIMAL(3,2) as average_rating,
        COALESCE(feedback_stats.total_feedback, 0)::INTEGER as total_feedback
    FROM ai_itinerary_analytics analytics
    LEFT JOIN (
        SELECT 
            itinerary_id,
            AVG(rating) as avg_rating,
            COUNT(*) as total_feedback
        FROM ai_itinerary_feedback
        WHERE itinerary_id = itinerary_id_param
        GROUP BY itinerary_id
    ) feedback_stats ON analytics.itinerary_id = feedback_stats.itinerary_id
    WHERE analytics.itinerary_id = itinerary_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to search itineraries by destination and interests
CREATE OR REPLACE FUNCTION search_itineraries(
    search_destination TEXT DEFAULT NULL,
    search_interests TEXT[] DEFAULT NULL,
    budget_min_param DECIMAL DEFAULT NULL,
    budget_max_param DECIMAL DEFAULT NULL,
    duration_min INTEGER DEFAULT NULL,
    duration_max INTEGER DEFAULT NULL,
    limit_param INTEGER DEFAULT 20,
    offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
    id TEXT,
    title TEXT,
    description TEXT,
    destination TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    duration INTEGER,
    travelers INTEGER,
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    budget_currency TEXT,
    interests TEXT[],
    travel_style TEXT,
    accommodation_type TEXT,
    is_public BOOLEAN,
    created_at TIMESTAMPTZ,
    user_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ai.id,
        ai.title,
        ai.description,
        ai.destination,
        ai.start_date,
        ai.end_date,
        ai.duration,
        ai.travelers,
        ai.budget_min,
        ai.budget_max,
        ai.budget_currency,
        ai.interests,
        ai.travel_style,
        ai.accommodation_type,
        ai.is_public,
        ai.created_at,
        ai.user_id
    FROM ai_itineraries ai
    WHERE 
        (search_destination IS NULL OR ai.destination ILIKE '%' || search_destination || '%')
        AND (search_interests IS NULL OR ai.interests && search_interests)
        AND (budget_min_param IS NULL OR ai.budget_max >= budget_min_param)
        AND (budget_max_param IS NULL OR ai.budget_min <= budget_max_param)
        AND (duration_min IS NULL OR ai.duration >= duration_min)
        AND (duration_max IS NULL OR ai.duration <= duration_max)
        AND ai.is_public = TRUE
    ORDER BY ai.created_at DESC
    LIMIT limit_param
    OFFSET offset_param;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 8. CREATE VIEWS FOR COMMON QUERIES
-- =============================================================================

-- View for public itineraries with basic info
CREATE OR REPLACE VIEW public_itineraries AS
SELECT 
    ai.id,
    ai.title,
    ai.description,
    ai.destination,
    ai.duration,
    ai.travelers,
    ai.budget_min,
    ai.budget_max,
    ai.budget_currency,
    ai.interests,
    ai.travel_style,
    ai.accommodation_type,
    ai.created_at,
    p.first_name,
    p.last_name,
    p.avatar_url
FROM ai_itineraries ai
JOIN profiles p ON ai.user_id = p.id
WHERE ai.is_public = TRUE;

-- View for itinerary statistics
CREATE OR REPLACE VIEW itinerary_statistics AS
SELECT 
    ai.id,
    ai.title,
    ai.destination,
    ai.duration,
    ai.travelers,
    ai.budget_min,
    ai.budget_max,
    ai.budget_currency,
    ai.interests,
    ai.travel_style,
    ai.accommodation_type,
    ai.is_public,
    ai.created_at,
    COALESCE(analytics.views_count, 0) as views_count,
    COALESCE(analytics.likes_count, 0) as likes_count,
    COALESCE(analytics.shares_count, 0) as shares_count,
    COALESCE(analytics.bookings_count, 0) as bookings_count,
    COALESCE(feedback_stats.avg_rating, 0) as average_rating,
    COALESCE(feedback_stats.total_feedback, 0) as total_feedback
FROM ai_itineraries ai
LEFT JOIN ai_itinerary_analytics analytics ON ai.id = analytics.itinerary_id
LEFT JOIN (
    SELECT 
        itinerary_id,
        AVG(rating) as avg_rating,
        COUNT(*) as total_feedback
    FROM ai_itinerary_feedback
    GROUP BY itinerary_id
) feedback_stats ON ai.id = feedback_stats.itinerary_id;

-- =============================================================================
-- 9. GRANT PERMISSIONS
-- =============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_itineraries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_itinerary_analytics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_itinerary_feedback TO authenticated;

-- Grant permissions to anon users for public itineraries
GRANT SELECT ON public_itineraries TO anon;
GRANT SELECT ON itinerary_statistics TO anon;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================================================
-- 10. COMMENTS
-- =============================================================================

COMMENT ON TABLE ai_itineraries IS 'Stores AI-generated travel itineraries with comprehensive travel planning data';
COMMENT ON COLUMN ai_itineraries.itinerary_data IS 'JSONB field containing the complete AI-generated itinerary structure';
COMMENT ON COLUMN ai_itineraries.interests IS 'Array of travel interests used to generate the itinerary';
COMMENT ON COLUMN ai_itineraries.budget_estimated_total IS 'AI-estimated total cost for the entire itinerary';

COMMENT ON TABLE ai_itinerary_analytics IS 'Tracks analytics and engagement metrics for AI itineraries';
COMMENT ON TABLE ai_itinerary_feedback IS 'Stores user feedback and ratings for AI-generated itineraries';

COMMENT ON FUNCTION get_itinerary_stats IS 'Returns comprehensive statistics for a specific itinerary';
COMMENT ON FUNCTION search_itineraries IS 'Advanced search function for public itineraries with multiple filters';
