-- Database optimization migration: Add comprehensive indices for performance
-- This migration adds strategic database indices to optimize query performance

-- ==============================================
-- HOTELS TABLE OPTIMIZATION
-- ==============================================

-- Index for location-based searches (city, state, country)
CREATE INDEX IF NOT EXISTS idx_hotels_location_search 
ON hotels (location_city, location_state, location_country);

-- Index for price range searches
CREATE INDEX IF NOT EXISTS idx_hotels_price_range 
ON hotels (price_per_night) WHERE price_per_night IS NOT NULL;

-- Index for star rating searches
CREATE INDEX IF NOT EXISTS idx_hotels_star_rating 
ON hotels (star_rating) WHERE star_rating IS NOT NULL;

-- Index for featured hotels
CREATE INDEX IF NOT EXISTS idx_hotels_featured 
ON hotels (is_featured) WHERE is_featured = true;

-- Index for availability searches
CREATE INDEX IF NOT EXISTS idx_hotels_availability 
ON hotels (available_rooms) WHERE available_rooms > 0;

-- Composite index for common search combinations
CREATE INDEX IF NOT EXISTS idx_hotels_search_composite 
ON hotels (location_city, price_per_night, star_rating, is_featured);

-- Index for slug lookups (for SEO-friendly URLs)
CREATE INDEX IF NOT EXISTS idx_hotels_slug 
ON hotels (slug) WHERE slug IS NOT NULL;

-- Index for created_at for sorting by newest
CREATE INDEX IF NOT EXISTS idx_hotels_created_at 
ON hotels (created_at DESC);

-- Index for updated_at for sorting by recently updated
CREATE INDEX IF NOT EXISTS idx_hotels_updated_at 
ON hotels (updated_at DESC);

-- ==============================================
-- TOURS TABLE OPTIMIZATION
-- ==============================================

-- Index for location-based searches
CREATE INDEX IF NOT EXISTS idx_tours_location_search 
ON tours (location_city, location_state, location_country);

-- Index for price range searches
CREATE INDEX IF NOT EXISTS idx_tours_price_range 
ON tours (price_per_person) WHERE price_per_person IS NOT NULL;

-- Index for duration searches
CREATE INDEX IF NOT EXISTS idx_tours_duration 
ON tours (duration_days) WHERE duration_days IS NOT NULL;

-- Index for difficulty level searches
CREATE INDEX IF NOT EXISTS idx_tours_difficulty 
ON tours (difficulty_level) WHERE difficulty_level IS NOT NULL;

-- Index for tour type searches
CREATE INDEX IF NOT EXISTS idx_tours_type 
ON tours (tour_type) WHERE tour_type IS NOT NULL;

-- Index for featured tours
CREATE INDEX IF NOT EXISTS idx_tours_featured 
ON tours (is_featured) WHERE is_featured = true;

-- Composite index for common search combinations
CREATE INDEX IF NOT EXISTS idx_tours_search_composite 
ON tours (location_city, price_per_person, duration_days, difficulty_level, tour_type, is_featured);

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_tours_slug 
ON tours (slug) WHERE slug IS NOT NULL;

-- Index for created_at for sorting
CREATE INDEX IF NOT EXISTS idx_tours_created_at 
ON tours (created_at DESC);

-- Index for updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_tours_updated_at 
ON tours (updated_at DESC);

-- ==============================================
-- FLIGHTS TABLE OPTIMIZATION
-- ==============================================

-- Index for origin airport searches
CREATE INDEX IF NOT EXISTS idx_flights_origin 
ON flights (origin_airport_code) WHERE origin_airport_code IS NOT NULL;

-- Index for destination airport searches
CREATE INDEX IF NOT EXISTS idx_flights_destination 
ON flights (destination_airport_code) WHERE destination_airport_code IS NOT NULL;

-- Index for departure date searches
CREATE INDEX IF NOT EXISTS idx_flights_departure_date 
ON flights (departure_date) WHERE departure_date IS NOT NULL;

-- Index for arrival date searches
CREATE INDEX IF NOT EXISTS idx_flights_arrival_date 
ON flights (arrival_date) WHERE arrival_date IS NOT NULL;

-- Composite index for route searches (most common query)
CREATE INDEX IF NOT EXISTS idx_flights_route_search 
ON flights (origin_airport_code, destination_airport_code, departure_date);

-- Index for airline searches
CREATE INDEX IF NOT EXISTS idx_flights_airline 
ON flights (airline_code) WHERE airline_code IS NOT NULL;

-- Index for price searches
CREATE INDEX IF NOT EXISTS idx_flights_price 
ON flights (price) WHERE price IS NOT NULL;

-- Index for flight number searches
CREATE INDEX IF NOT EXISTS idx_flights_flight_number 
ON flights (flight_number) WHERE flight_number IS NOT NULL;

-- Index for featured flights
CREATE INDEX IF NOT EXISTS idx_flights_featured 
ON flights (is_featured) WHERE is_featured = true;

-- Composite index for price and route
CREATE INDEX IF NOT EXISTS idx_flights_price_route 
ON flights (origin_airport_code, destination_airport_code, price);

-- ==============================================
-- BOOKINGS TABLE OPTIMIZATION
-- ==============================================

-- Index for user bookings
CREATE INDEX IF NOT EXISTS idx_bookings_user_id 
ON bookings (user_id) WHERE user_id IS NOT NULL;

-- Index for booking status searches
CREATE INDEX IF NOT EXISTS idx_bookings_status 
ON bookings (status) WHERE status IS NOT NULL;

-- Index for booking date searches
CREATE INDEX IF NOT EXISTS idx_bookings_created_at 
ON bookings (created_at DESC);

-- Index for check-in date searches
CREATE INDEX IF NOT EXISTS idx_bookings_check_in 
ON bookings (check_in_date) WHERE check_in_date IS NOT NULL;

-- Index for check-out date searches
CREATE INDEX IF NOT EXISTS idx_bookings_check_out 
ON bookings (check_out_date) WHERE check_out_date IS NOT NULL;

-- Composite index for user bookings with status
CREATE INDEX IF NOT EXISTS idx_bookings_user_status 
ON bookings (user_id, status);

-- Index for booking reference searches
CREATE INDEX IF NOT EXISTS idx_bookings_reference 
ON bookings (booking_reference) WHERE booking_reference IS NOT NULL;

-- Index for item type searches (hotel, flight, tour)
CREATE INDEX IF NOT EXISTS idx_bookings_item_type 
ON bookings (item_type) WHERE item_type IS NOT NULL;

-- Composite index for item bookings
CREATE INDEX IF NOT EXISTS idx_bookings_item 
ON bookings (item_type, item_id);

-- ==============================================
-- PAYMENTS TABLE OPTIMIZATION
-- ==============================================

-- Index for payment status searches
CREATE INDEX IF NOT EXISTS idx_payments_status 
ON payments (status) WHERE status IS NOT NULL;

-- Index for payment method searches
CREATE INDEX IF NOT EXISTS idx_payments_method 
ON payments (payment_method) WHERE payment_method IS NOT NULL;

-- Index for payment date searches
CREATE INDEX IF NOT EXISTS idx_payments_created_at 
ON payments (created_at DESC);

-- Index for Razorpay payment ID searches
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_id 
ON payments (razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;

-- Index for order ID searches
CREATE INDEX IF NOT EXISTS idx_payments_order_id 
ON payments (razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;

-- Composite index for booking payments
CREATE INDEX IF NOT EXISTS idx_payments_booking 
ON payments (booking_id) WHERE booking_id IS NOT NULL;

-- ==============================================
-- REVIEWS TABLE OPTIMIZATION
-- ==============================================

-- Index for item reviews (hotel, tour, flight)
CREATE INDEX IF NOT EXISTS idx_reviews_item 
ON reviews (item_type, item_id);

-- Index for user reviews
CREATE INDEX IF NOT EXISTS idx_reviews_user_id 
ON reviews (user_id) WHERE user_id IS NOT NULL;

-- Index for rating searches
CREATE INDEX IF NOT EXISTS idx_reviews_rating 
ON reviews (rating) WHERE rating IS NOT NULL;

-- Index for review date searches
CREATE INDEX IF NOT EXISTS idx_reviews_created_at 
ON reviews (created_at DESC);

-- Composite index for item reviews with rating
CREATE INDEX IF NOT EXISTS idx_reviews_item_rating 
ON reviews (item_type, item_id, rating);

-- ==============================================
-- PROFILES TABLE OPTIMIZATION
-- ==============================================

-- Index for email searches
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles (email) WHERE email IS NOT NULL;

-- Index for phone searches
CREATE INDEX IF NOT EXISTS idx_profiles_phone 
ON profiles (phone) WHERE phone IS NOT NULL;

-- Index for user role searches
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON profiles (role) WHERE role IS NOT NULL;

-- Index for profile creation date
CREATE INDEX IF NOT EXISTS idx_profiles_created_at 
ON profiles (created_at DESC);

-- Index for profile updates
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at 
ON profiles (updated_at DESC);

-- ==============================================
-- AI ITINERARIES TABLE OPTIMIZATION
-- ==============================================

-- Index for user itineraries
CREATE INDEX IF NOT EXISTS idx_ai_itineraries_user_id 
ON ai_itineraries (user_id) WHERE user_id IS NOT NULL;

-- Index for destination searches
CREATE INDEX IF NOT EXISTS idx_ai_itineraries_destination 
ON ai_itineraries (destination) WHERE destination IS NOT NULL;

-- Index for trip type searches
CREATE INDEX IF NOT EXISTS idx_ai_itineraries_trip_type 
ON ai_itineraries (trip_type) WHERE trip_type IS NOT NULL;

-- Index for duration searches
CREATE INDEX IF NOT EXISTS idx_ai_itineraries_duration 
ON ai_itineraries (duration_days) WHERE duration_days IS NOT NULL;

-- Index for budget range searches
CREATE INDEX IF NOT EXISTS idx_ai_itineraries_budget 
ON ai_itineraries (budget_range) WHERE budget_range IS NOT NULL;

-- Index for creation date
CREATE INDEX IF NOT EXISTS idx_ai_itineraries_created_at 
ON ai_itineraries (created_at DESC);

-- Composite index for destination and trip type
CREATE INDEX IF NOT EXISTS idx_ai_itineraries_destination_type 
ON ai_itineraries (destination, trip_type);

-- ==============================================
-- PRICING AVAILABILITY TABLE OPTIMIZATION
-- ==============================================

-- Index for item pricing searches
CREATE INDEX IF NOT EXISTS idx_pricing_item 
ON pricing_availability (item_type, item_id);

-- Index for date range searches
CREATE INDEX IF NOT EXISTS idx_pricing_date 
ON pricing_availability (date) WHERE date IS NOT NULL;

-- Index for price searches
CREATE INDEX IF NOT EXISTS idx_pricing_price 
ON pricing_availability (price) WHERE price IS NOT NULL;

-- Index for availability searches
CREATE INDEX IF NOT EXISTS idx_pricing_availability 
ON pricing_availability (available_quantity) WHERE available_quantity > 0;

-- Composite index for item and date
CREATE INDEX IF NOT EXISTS idx_pricing_item_date 
ON pricing_availability (item_type, item_id, date);

-- ==============================================
-- CONTENT ANALYTICS TABLE OPTIMIZATION
-- ==============================================

-- Index for item analytics
CREATE INDEX IF NOT EXISTS idx_content_analytics_item 
ON content_analytics (item_type, item_id);

-- Index for date range analytics
CREATE INDEX IF NOT EXISTS idx_content_analytics_date 
ON content_analytics (date) WHERE date IS NOT NULL;

-- Index for metric type searches
CREATE INDEX IF NOT EXISTS idx_content_analytics_metric 
ON content_analytics (metric_type) WHERE metric_type IS NOT NULL;

-- Composite index for item and date analytics
CREATE INDEX IF NOT EXISTS idx_content_analytics_item_date 
ON content_analytics (item_type, item_id, date);

-- ==============================================
-- FULL-TEXT SEARCH INDICES
-- ==============================================

-- Full-text search index for hotels
CREATE INDEX IF NOT EXISTS idx_hotels_fulltext 
ON hotels USING gin(to_tsvector('english', 
  coalesce(name, '') || ' ' || 
  coalesce(description, '') || ' ' || 
  coalesce(location_city, '') || ' ' || 
  coalesce(location_state, '') || ' ' || 
  coalesce(location_country, '')
));

-- Full-text search index for tours
CREATE INDEX IF NOT EXISTS idx_tours_fulltext 
ON tours USING gin(to_tsvector('english', 
  coalesce(name, '') || ' ' || 
  coalesce(description, '') || ' ' || 
  coalesce(location_city, '') || ' ' || 
  coalesce(location_state, '') || ' ' || 
  coalesce(location_country, '') || ' ' ||
  coalesce(highlights, '')
));

-- Full-text search index for flights
CREATE INDEX IF NOT EXISTS idx_flights_fulltext 
ON flights USING gin(to_tsvector('english', 
  coalesce(airline_name, '') || ' ' || 
  coalesce(origin_airport_name, '') || ' ' || 
  coalesce(destination_airport_name, '') || ' ' ||
  coalesce(flight_number, '')
));

-- ==============================================
-- PARTIAL INDICES FOR COMMON FILTERS
-- ==============================================

-- Index for active hotels only
CREATE INDEX IF NOT EXISTS idx_hotels_active 
ON hotels (location_city, price_per_night, star_rating) 
WHERE is_active = true AND available_rooms > 0;

-- Index for active tours only
CREATE INDEX IF NOT EXISTS idx_tours_active 
ON tours (location_city, price_per_person, duration_days) 
WHERE is_active = true;

-- Index for confirmed bookings only
CREATE INDEX IF NOT EXISTS idx_bookings_confirmed 
ON bookings (user_id, created_at DESC) 
WHERE status = 'confirmed';

-- Index for successful payments only
CREATE INDEX IF NOT EXISTS idx_payments_successful 
ON payments (booking_id, created_at DESC) 
WHERE status = 'captured';

-- ==============================================
-- STATISTICS UPDATE
-- ==============================================

-- Update table statistics for better query planning
ANALYZE hotels;
ANALYZE tours;
ANALYZE flights;
ANALYZE bookings;
ANALYZE payments;
ANALYZE reviews;
ANALYZE profiles;
ANALYZE ai_itineraries;
ANALYZE pricing_availability;
ANALYZE content_analytics;

-- ==============================================
-- INDEX USAGE MONITORING VIEWS
-- ==============================================

-- Create view to monitor index usage
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan,
    CASE 
        WHEN idx_scan > 0 THEN (idx_tup_read::float / idx_scan)
        ELSE 0 
    END as avg_tuples_per_scan
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Create view to monitor slow queries
CREATE OR REPLACE VIEW slow_query_stats AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE mean_time > 100 -- queries taking more than 100ms on average
ORDER BY mean_time DESC;

-- ==============================================
-- PERFORMANCE OPTIMIZATION FUNCTIONS
-- ==============================================

-- Function to get table statistics
CREATE OR REPLACE FUNCTION get_table_stats(table_name text)
RETURNS TABLE(
    table_size text,
    index_size text,
    total_size text,
    row_count bigint,
    last_vacuum timestamp,
    last_autovacuum timestamp,
    last_analyze timestamp,
    last_autoanalyze timestamp
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pg_size_pretty(pg_total_relation_size(table_name::regclass)) as table_size,
        pg_size_pretty(pg_indexes_size(table_name::regclass)) as index_size,
        pg_size_pretty(pg_total_relation_size(table_name::regclass)) as total_size,
        (SELECT n_tup_ins + n_tup_upd + n_tup_del FROM pg_stat_user_tables WHERE relname = table_name) as row_count,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
    FROM pg_stat_user_tables 
    WHERE relname = table_name;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze query performance
CREATE OR REPLACE FUNCTION analyze_query_performance(query_text text)
RETURNS TABLE(
    plan_type text,
    estimated_cost numeric,
    estimated_rows bigint,
    actual_rows bigint,
    actual_time numeric
) AS $$
BEGIN
    RETURN QUERY
    EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' || query_text;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- COMMENTS FOR DOCUMENTATION
-- ==============================================

COMMENT ON INDEX idx_hotels_location_search IS 'Optimizes searches by city, state, and country';
COMMENT ON INDEX idx_hotels_price_range IS 'Optimizes price range filtering';
COMMENT ON INDEX idx_hotels_search_composite IS 'Composite index for common hotel search combinations';
COMMENT ON INDEX idx_tours_search_composite IS 'Composite index for common tour search combinations';
COMMENT ON INDEX idx_flights_route_search IS 'Most important index for flight route searches';
COMMENT ON INDEX idx_bookings_user_status IS 'Optimizes user booking queries with status filtering';
COMMENT ON INDEX idx_payments_booking IS 'Optimizes payment queries by booking ID';
COMMENT ON INDEX idx_reviews_item_rating IS 'Optimizes review queries by item and rating';
COMMENT ON INDEX idx_ai_itineraries_destination_type IS 'Optimizes AI itinerary searches by destination and type';
COMMENT ON INDEX idx_pricing_item_date IS 'Optimizes pricing queries by item and date';
COMMENT ON INDEX idx_content_analytics_item_date IS 'Optimizes analytics queries by item and date';

-- ==============================================
-- MIGRATION COMPLETE
-- ==============================================

-- Log completion
INSERT INTO migration_log (migration_name, executed_at, description) 
VALUES (
    'database_optimization_indices', 
    NOW(), 
    'Added comprehensive database indices for query optimization and performance improvement'
) ON CONFLICT DO NOTHING;
