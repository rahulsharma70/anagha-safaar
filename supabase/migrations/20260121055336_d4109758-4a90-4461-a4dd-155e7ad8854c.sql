-- Fix overly permissive RLS policies

-- Drop and recreate booking_history INSERT policy with proper check
DROP POLICY IF EXISTS "System can create booking history" ON public.booking_history;

CREATE POLICY "Booking history can be created for user's bookings" 
ON public.booking_history FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = booking_history.booking_id 
    AND (bookings.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- The loyalty_points "System can create" policy was from previous migrations
-- Let's check and fix it
DROP POLICY IF EXISTS "System can create loyalty points" ON public.loyalty_points;

CREATE POLICY "Loyalty points can be created for authenticated users" 
ON public.loyalty_points FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Fix referrals policies
DROP POLICY IF EXISTS "System can create referrals" ON public.referrals;
DROP POLICY IF EXISTS "System can update referrals" ON public.referrals;

CREATE POLICY "Users can create referrals" 
ON public.referrals FOR INSERT 
WITH CHECK (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can update their referrals" 
ON public.referrals FOR UPDATE 
USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id OR has_role(auth.uid(), 'admin'::app_role));