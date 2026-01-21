-- Add travel preferences and documents columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS travel_preferences jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS emergency_contacts jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS travel_documents jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS nationality text,
ADD COLUMN IF NOT EXISTS passport_number text,
ADD COLUMN IF NOT EXISTS passport_expiry date,
ADD COLUMN IF NOT EXISTS address jsonb DEFAULT '{}'::jsonb;

-- Create travel_companions table for group bookings
CREATE TABLE IF NOT EXISTS public.travel_companions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  date_of_birth date,
  relationship text,
  passport_number text,
  passport_expiry date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on travel_companions
ALTER TABLE public.travel_companions ENABLE ROW LEVEL SECURITY;

-- RLS policies for travel_companions
CREATE POLICY "Users can view their own companions" 
ON public.travel_companions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own companions" 
ON public.travel_companions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own companions" 
ON public.travel_companions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own companions" 
ON public.travel_companions FOR DELETE 
USING (auth.uid() = user_id);

-- Create booking_history table for tracking all booking changes
CREATE TABLE IF NOT EXISTS public.booking_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  action text NOT NULL,
  old_status text,
  new_status text,
  notes text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on booking_history
ALTER TABLE public.booking_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for booking_history
CREATE POLICY "Users can view their booking history" 
ON public.booking_history FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = booking_history.booking_id 
    AND bookings.user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "System can create booking history" 
ON public.booking_history FOR INSERT 
WITH CHECK (true);

-- Add cancellation fields to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
ADD COLUMN IF NOT EXISTS refund_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_status text DEFAULT 'none';

-- Create loyalty_rewards table for redeemable rewards
CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  points_required integer NOT NULL,
  reward_type text NOT NULL,
  reward_value numeric,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on loyalty_rewards
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- RLS policies for loyalty_rewards (public read, admin write)
CREATE POLICY "Everyone can view active rewards" 
ON public.loyalty_rewards FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage rewards" 
ON public.loyalty_rewards FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create user_redeemed_rewards table
CREATE TABLE IF NOT EXISTS public.user_redeemed_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reward_id uuid NOT NULL REFERENCES public.loyalty_rewards(id),
  points_spent integer NOT NULL,
  status text DEFAULT 'active',
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  used_at timestamptz
);

-- Enable RLS on user_redeemed_rewards
ALTER TABLE public.user_redeemed_rewards ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_redeemed_rewards
CREATE POLICY "Users can view their redeemed rewards" 
ON public.user_redeemed_rewards FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can redeem rewards" 
ON public.user_redeemed_rewards FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their redeemed rewards" 
ON public.user_redeemed_rewards FOR UPDATE 
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_travel_companions_user_id ON public.travel_companions(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_history_booking_id ON public.booking_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_user_redeemed_rewards_user_id ON public.user_redeemed_rewards(user_id);

-- Trigger for updated_at on travel_companions
CREATE TRIGGER update_travel_companions_updated_at
BEFORE UPDATE ON public.travel_companions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();