-- Enhanced Booking Management Migration
-- This migration adds comprehensive booking lock management, events tracking, and inventory management

-- Create booking events table for audit trail
CREATE TABLE public.booking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on booking events
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Booking events are viewable by users and admins"
  ON public.booking_events FOR SELECT
  USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Booking events can be inserted by authenticated users"
  ON public.booking_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create booking locks table (backup for Redis)
CREATE TABLE public.booking_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lock_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('hotel_room', 'flight_seat', 'tour_slot')),
  item_id UUID NOT NULL,
  item_details JSONB DEFAULT '{}'::jsonb,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  extensions INTEGER DEFAULT 0,
  session_id TEXT NOT NULL,
  pricing JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'released', 'confirmed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on booking locks
ALTER TABLE public.booking_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own booking locks"
  ON public.booking_locks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own booking locks"
  ON public.booking_locks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own booking locks"
  ON public.booking_locks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own booking locks"
  ON public.booking_locks FOR DELETE
  USING (auth.uid() = user_id);

-- Create inventory tracking table
CREATE TABLE public.inventory_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL CHECK (item_type IN ('hotel_room', 'flight_seat', 'tour_slot')),
  item_id UUID NOT NULL,
  date DATE NOT NULL,
  total_inventory INTEGER NOT NULL DEFAULT 0,
  available_inventory INTEGER NOT NULL DEFAULT 0,
  locked_inventory INTEGER NOT NULL DEFAULT 0,
  booked_inventory INTEGER NOT NULL DEFAULT 0,
  pricing JSONB DEFAULT '{}'::jsonb,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(item_type, item_id, date)
);

-- Enable RLS on inventory tracking
ALTER TABLE public.inventory_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inventory tracking is viewable by everyone"
  ON public.inventory_tracking FOR SELECT
  USING (true);

CREATE POLICY "Inventory tracking can be updated by system"
  ON public.inventory_tracking FOR ALL
  WITH CHECK (true);

-- Create dynamic pricing table
CREATE TABLE public.dynamic_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL CHECK (item_type IN ('hotel_room', 'flight_seat', 'tour_slot')),
  item_id UUID NOT NULL,
  date DATE NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  demand_multiplier DECIMAL(5, 3) DEFAULT 1.000,
  seasonal_multiplier DECIMAL(5, 3) DEFAULT 1.000,
  time_multiplier DECIMAL(5, 3) DEFAULT 1.000,
  final_price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  factors JSONB DEFAULT '{}'::jsonb,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(item_type, item_id, date)
);

-- Enable RLS on dynamic pricing
ALTER TABLE public.dynamic_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dynamic pricing is viewable by everyone"
  ON public.dynamic_pricing FOR SELECT
  USING (true);

CREATE POLICY "Dynamic pricing can be updated by system"
  ON public.dynamic_pricing FOR ALL
  WITH CHECK (true);

-- Create booking confirmations table
CREATE TABLE public.booking_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  lock_id TEXT NOT NULL,
  confirmation_code TEXT UNIQUE NOT NULL,
  payment_data JSONB NOT NULL,
  confirmation_method TEXT DEFAULT 'email',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on booking confirmations
ALTER TABLE public.booking_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own booking confirmations"
  ON public.booking_confirmations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = booking_confirmations.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Booking confirmations can be inserted by system"
  ON public.booking_confirmations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Booking confirmations can be updated by system"
  ON public.booking_confirmations FOR UPDATE
  WITH CHECK (true);

-- Add new columns to existing bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS 
  lock_id TEXT,
  confirmation_code TEXT,
  pricing_details JSONB DEFAULT '{}'::jsonb,
  payment_data JSONB DEFAULT '{}'::jsonb,
  booking_source TEXT DEFAULT 'web',
  referral_source TEXT,
  device_info JSONB DEFAULT '{}'::jsonb,
  session_data JSONB DEFAULT '{}'::jsonb,
  cancellation_policy TEXT,
  refund_policy TEXT,
  terms_accepted BOOLEAN DEFAULT false,
  terms_version TEXT,
  marketing_consent BOOLEAN DEFAULT false,
  communication_preferences JSONB DEFAULT '{}'::jsonb;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_booking_events_user_id ON public.booking_events(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_events_event_type ON public.booking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_booking_events_created_at ON public.booking_events(created_at);

CREATE INDEX IF NOT EXISTS idx_booking_locks_user_id ON public.booking_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_locks_item_type_id ON public.booking_locks(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_booking_locks_expires_at ON public.booking_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_booking_locks_status ON public.booking_locks(status);

CREATE INDEX IF NOT EXISTS idx_inventory_tracking_item_type_id ON public.inventory_tracking(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tracking_date ON public.inventory_tracking(date);
CREATE INDEX IF NOT EXISTS idx_inventory_tracking_available ON public.inventory_tracking(available_inventory);

CREATE INDEX IF NOT EXISTS idx_dynamic_pricing_item_type_id ON public.dynamic_pricing(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_pricing_date ON public.dynamic_pricing(date);
CREATE INDEX IF NOT EXISTS idx_dynamic_pricing_final_price ON public.dynamic_pricing(final_price);

CREATE INDEX IF NOT EXISTS idx_booking_confirmations_booking_id ON public.booking_confirmations(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_confirmations_confirmation_code ON public.booking_confirmations(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_booking_confirmations_status ON public.booking_confirmations(status);

CREATE INDEX IF NOT EXISTS idx_bookings_lock_id ON public.bookings(lock_id);
CREATE INDEX IF NOT EXISTS idx_bookings_confirmation_code ON public.bookings(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_source ON public.bookings(booking_source);

-- Create function to cleanup expired locks
CREATE OR REPLACE FUNCTION public.cleanup_expired_booking_locks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Update expired locks
  UPDATE public.booking_locks 
  SET status = 'expired', updated_at = now()
  WHERE expires_at < now() AND status = 'active';
  
  -- Log cleanup event
  INSERT INTO public.booking_events (
    event_type,
    data,
    created_at
  ) VALUES (
    'cleanup_expired_locks',
    jsonb_build_object(
      'cleaned_at', now(),
      'expired_count', (
        SELECT count(*) FROM public.booking_locks 
        WHERE expires_at < now() AND status = 'expired'
      )
    ),
    now()
  );
END;
$$;

-- Create function to update inventory
CREATE OR REPLACE FUNCTION public.update_inventory(
  p_item_type TEXT,
  p_item_id UUID,
  p_date DATE,
  p_delta INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.inventory_tracking (
    item_type,
    item_id,
    date,
    total_inventory,
    available_inventory,
    locked_inventory,
    last_updated
  ) VALUES (
    p_item_type,
    p_item_id,
    p_date,
    CASE 
      WHEN p_item_type = 'hotel_room' THEN (SELECT available_rooms FROM public.hotels WHERE id = p_item_id)
      WHEN p_item_type = 'flight_seat' THEN (SELECT available_seats FROM public.flights WHERE id = p_item_id)
      WHEN p_item_type = 'tour_slot' THEN (SELECT max_group_size FROM public.tours WHERE id = p_item_id)
      ELSE 0
    END,
    CASE 
      WHEN p_item_type = 'hotel_room' THEN (SELECT available_rooms FROM public.hotels WHERE id = p_item_id)
      WHEN p_item_type = 'flight_seat' THEN (SELECT available_seats FROM public.flights WHERE id = p_item_id)
      WHEN p_item_type = 'tour_slot' THEN (SELECT max_group_size FROM public.tours WHERE id = p_item_id)
      ELSE 0
    END + p_delta,
    0,
    now()
  )
  ON CONFLICT (item_type, item_id, date) 
  DO UPDATE SET
    available_inventory = inventory_tracking.available_inventory + p_delta,
    locked_inventory = CASE 
      WHEN p_delta < 0 THEN locked_inventory + ABS(p_delta)
      ELSE locked_inventory
    END,
    last_updated = now();
END;
$$;

-- Create function to get calendar availability
CREATE OR REPLACE FUNCTION public.get_calendar_availability(
  p_item_type TEXT,
  p_item_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  date DATE,
  available BOOLEAN,
  price DECIMAL(10, 2),
  inventory INTEGER,
  locked INTEGER,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.date,
    CASE 
      WHEN it.available_inventory > it.locked_inventory THEN true
      ELSE false
    END as available,
    COALESCE(dp.final_price, 0) as price,
    COALESCE(it.available_inventory, 0) as inventory,
    COALESCE(it.locked_inventory, 0) as locked,
    jsonb_build_object(
      'pricing', dp.factors,
      'last_updated', it.last_updated
    ) as metadata
  FROM generate_series(p_start_date, p_end_date, '1 day'::interval) as d(date)
  LEFT JOIN public.inventory_tracking it ON (
    it.item_type = p_item_type 
    AND it.item_id = p_item_id 
    AND it.date = d.date
  )
  LEFT JOIN public.dynamic_pricing dp ON (
    dp.item_type = p_item_type 
    AND dp.item_id = p_item_id 
    AND dp.date = d.date
  )
  ORDER BY d.date;
END;
$$;

-- Create function to generate booking confirmation code
CREATE OR REPLACE FUNCTION public.generate_confirmation_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  code TEXT;
BEGIN
  -- Generate a unique confirmation code
  code := 'BK' || to_char(now(), 'YYYYMMDD') || '-' || 
          upper(substring(md5(random()::text) from 1 for 6));
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.booking_confirmations WHERE confirmation_code = code) LOOP
    code := 'BK' || to_char(now(), 'YYYYMMDD') || '-' || 
            upper(substring(md5(random()::text) from 1 for 6));
  END LOOP;
  
  RETURN code;
END;
$$;

-- Create trigger to automatically create booking confirmation
CREATE OR REPLACE FUNCTION public.create_booking_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  confirmation_code TEXT;
BEGIN
  -- Generate confirmation code
  confirmation_code := public.generate_confirmation_code();
  
  -- Update booking with confirmation code
  NEW.confirmation_code := confirmation_code;
  
  -- Create booking confirmation record
  INSERT INTO public.booking_confirmations (
    booking_id,
    lock_id,
    confirmation_code,
    payment_data,
    status
  ) VALUES (
    NEW.id,
    NEW.lock_id,
    confirmation_code,
    NEW.payment_data,
    'pending'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_booking_confirmation
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION public.create_booking_confirmation();

-- Create trigger to update inventory when booking is confirmed
CREATE OR REPLACE FUNCTION public.update_inventory_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Update inventory when booking is confirmed
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    PERFORM public.update_inventory(
      NEW.item_type,
      NEW.item_id,
      NEW.start_date,
      -1
    );
  END IF;
  
  -- Restore inventory when booking is cancelled
  IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    PERFORM public.update_inventory(
      NEW.item_type,
      NEW.item_id,
      NEW.start_date,
      1
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_inventory_on_booking
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_on_booking();

-- Create updated_at triggers
CREATE TRIGGER update_booking_locks_updated_at BEFORE UPDATE ON public.booking_locks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_tracking_updated_at BEFORE UPDATE ON public.inventory_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dynamic_pricing_updated_at BEFORE UPDATE ON public.dynamic_pricing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_booking_confirmations_updated_at BEFORE UPDATE ON public.booking_confirmations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial inventory data for existing items
INSERT INTO public.inventory_tracking (item_type, item_id, date, total_inventory, available_inventory)
SELECT 
  'hotel_room',
  id,
  CURRENT_DATE,
  available_rooms,
  available_rooms
FROM public.hotels
WHERE available_rooms > 0
ON CONFLICT (item_type, item_id, date) DO NOTHING;

INSERT INTO public.inventory_tracking (item_type, item_id, date, total_inventory, available_inventory)
SELECT 
  'flight_seat',
  id,
  CURRENT_DATE,
  available_seats,
  available_seats
FROM public.flights
WHERE available_seats > 0
ON CONFLICT (item_type, item_id, date) DO NOTHING;

INSERT INTO public.inventory_tracking (item_type, item_id, date, total_inventory, available_inventory)
SELECT 
  'tour_slot',
  id,
  CURRENT_DATE,
  max_group_size,
  max_group_size
FROM public.tours
WHERE max_group_size > 0
ON CONFLICT (item_type, item_id, date) DO NOTHING;

-- Create view for booking summary
CREATE VIEW public.booking_summary AS
SELECT 
  b.id,
  b.booking_reference,
  b.user_id,
  b.item_type,
  b.item_id,
  b.start_date,
  b.end_date,
  b.total_amount,
  b.currency,
  b.status,
  b.payment_status,
  b.created_at,
  bc.confirmation_code,
  bc.status as confirmation_status,
  bl.lock_id,
  bl.extensions,
  CASE 
    WHEN b.item_type = 'hotel_room' THEN h.name
    WHEN b.item_type = 'flight_seat' THEN f.airline || ' ' || f.flight_number
    WHEN b.item_type = 'tour_slot' THEN t.name
    ELSE 'Unknown'
  END as item_name
FROM public.bookings b
LEFT JOIN public.booking_confirmations bc ON b.id = bc.booking_id
LEFT JOIN public.booking_locks bl ON b.lock_id = bl.lock_id
LEFT JOIN public.hotels h ON b.item_type = 'hotel_room' AND b.item_id = h.id
LEFT JOIN public.flights f ON b.item_type = 'flight_seat' AND b.item_id = f.id
LEFT JOIN public.tours t ON b.item_type = 'tour_slot' AND b.item_id = t.id;

-- Enable RLS on booking summary view
ALTER VIEW public.booking_summary SET (security_invoker = true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.booking_summary TO authenticated;

-- Create function to get booking analytics
CREATE OR REPLACE FUNCTION public.get_booking_analytics(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'period', jsonb_build_object(
      'start', p_start_date,
      'end', p_end_date
    ),
    'bookings', (
      SELECT jsonb_build_object(
        'total', count(*),
        'confirmed', count(*) FILTER (WHERE status = 'confirmed'),
        'cancelled', count(*) FILTER (WHERE status = 'cancelled'),
        'pending', count(*) FILTER (WHERE status = 'pending'),
        'completed', count(*) FILTER (WHERE status = 'completed')
      )
      FROM public.bookings 
      WHERE created_at::date BETWEEN p_start_date AND p_end_date
    ),
    'revenue', (
      SELECT jsonb_build_object(
        'total', sum(total_amount),
        'confirmed', sum(total_amount) FILTER (WHERE status = 'confirmed'),
        'average', avg(total_amount) FILTER (WHERE status = 'confirmed')
      )
      FROM public.bookings 
      WHERE created_at::date BETWEEN p_start_date AND p_end_date
    ),
    'locks', (
      SELECT jsonb_build_object(
        'total', count(*),
        'expired', count(*) FILTER (WHERE status = 'expired'),
        'confirmed', count(*) FILTER (WHERE status = 'confirmed'),
        'average_extensions', avg(extensions)
      )
      FROM public.booking_locks 
      WHERE created_at::date BETWEEN p_start_date AND p_end_date
    ),
    'inventory', (
      SELECT jsonb_build_object(
        'total_items', count(DISTINCT item_id),
        'average_utilization', avg(booked_inventory::float / total_inventory * 100)
      )
      FROM public.inventory_tracking 
      WHERE date BETWEEN p_start_date AND p_end_date
    )
  ) INTO result;
  
  RETURN result;
END;
$$;
