-- Create wishlist table
CREATE TABLE public.wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('hotel', 'tour', 'flight')),
  item_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id, item_type)
);

-- Enable RLS
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wishlist
CREATE POLICY "Users can view their own wishlist"
  ON public.wishlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their wishlist"
  ON public.wishlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their wishlist"
  ON public.wishlist FOR DELETE
  USING (auth.uid() = user_id);

-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_amount NUMERIC DEFAULT 500,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(referred_user_id)
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referrals
CREATE POLICY "Users can view their referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "System can create referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update referrals"
  ON public.referrals FOR UPDATE
  USING (true);

-- Create loyalty_points table
CREATE TABLE public.loyalty_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_points
CREATE POLICY "Users can view their own points"
  ON public.loyalty_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own points"
  ON public.loyalty_points FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create loyalty points"
  ON public.loyalty_points FOR INSERT
  WITH CHECK (true);

-- Create loyalty_transactions table for point history
CREATE TABLE public.loyalty_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'expire')),
  description TEXT NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.loyalty_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Create function to update loyalty tier
CREATE OR REPLACE FUNCTION update_loyalty_tier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lifetime_points >= 10000 THEN
    NEW.tier := 'platinum';
  ELSIF NEW.lifetime_points >= 5000 THEN
    NEW.tier := 'gold';
  ELSIF NEW.lifetime_points >= 1000 THEN
    NEW.tier := 'silver';
  ELSE
    NEW.tier := 'bronze';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for loyalty tier updates
CREATE TRIGGER update_loyalty_tier_trigger
  BEFORE UPDATE ON public.loyalty_points
  FOR EACH ROW
  EXECUTE FUNCTION update_loyalty_tier();

-- Create function to award points on booking
CREATE OR REPLACE FUNCTION award_booking_points()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award INTEGER;
  user_loyalty_id UUID;
BEGIN
  -- Only award points for confirmed bookings
  IF NEW.status = 'confirmed' AND NEW.payment_status = 'paid' THEN
    -- Calculate points: 10 points per ₹100 spent
    points_to_award := FLOOR(NEW.total_amount / 100) * 10;
    
    -- Get or create loyalty record
    INSERT INTO public.loyalty_points (user_id, points, lifetime_points)
    VALUES (NEW.user_id, points_to_award, points_to_award)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      points = loyalty_points.points + points_to_award,
      lifetime_points = loyalty_points.lifetime_points + points_to_award
    RETURNING id INTO user_loyalty_id;
    
    -- Record transaction
    INSERT INTO public.loyalty_transactions (user_id, points, transaction_type, description, booking_id)
    VALUES (NEW.user_id, points_to_award, 'earn', 'Booking reward', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for booking points
CREATE TRIGGER award_booking_points_trigger
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION award_booking_points();

-- Create indexes for performance
CREATE INDEX idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_loyalty_points_user_id ON public.loyalty_points(user_id);
CREATE INDEX idx_loyalty_transactions_user_id ON public.loyalty_transactions(user_id);