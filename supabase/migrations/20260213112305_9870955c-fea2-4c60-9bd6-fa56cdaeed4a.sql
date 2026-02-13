
-- 1. COUPONS / PROMO CODES (MakeMyTrip core feature)
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'flat'
  discount_value NUMERIC NOT NULL,
  min_order_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  applicable_to TEXT[] DEFAULT '{}', -- ['hotel','flight','tour']
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. COUPON USAGE TRACKING
CREATE TABLE public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id),
  user_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id),
  discount_applied NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their coupon usage" ON public.coupon_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create coupon usage" ON public.coupon_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all coupon usage" ON public.coupon_usage
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. PAYMENT TRANSACTIONS (detailed payment tracking like MakeMyTrip)
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_method TEXT, -- 'card', 'upi', 'netbanking', 'wallet'
  payment_gateway TEXT, -- 'razorpay', 'stripe'
  gateway_transaction_id TEXT,
  gateway_order_id TEXT,
  status TEXT NOT NULL DEFAULT 'initiated', -- 'initiated','processing','completed','failed','refunded'
  failure_reason TEXT,
  refund_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their payments" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create payments" ON public.payment_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update payments" ON public.payment_transactions
  FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- 4. CONTACT FORM SUBMISSIONS
CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new', -- 'new','in_progress','resolved','closed'
  assigned_to UUID,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage submissions" ON public.contact_submissions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. NEWSLETTER SUBSCRIPTIONS
CREATE TABLE public.newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  is_subscribed BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage subscriptions" ON public.newsletter_subscriptions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. SUPPORT TICKETS (MakeMyTrip customer support)
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- 'booking','payment','refund','cancellation','general'
  priority TEXT DEFAULT 'medium', -- 'low','medium','high','urgent'
  status TEXT DEFAULT 'open', -- 'open','in_progress','waiting_on_customer','resolved','closed'
  assigned_to UUID,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and admins can update tickets" ON public.support_tickets
  FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- 7. SUPPORT TICKET MESSAGES (conversation thread)
CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ticket participants can view messages" ON public.ticket_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)))
  );

CREATE POLICY "Ticket participants can send messages" ON public.ticket_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 8. PRICE ALERTS (MakeMyTrip price drop alerts)
CREATE TABLE public.price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL, -- 'flight','hotel','tour'
  item_id UUID NOT NULL,
  target_price NUMERIC NOT NULL,
  current_price NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their alerts" ON public.price_alerts
  FOR ALL USING (auth.uid() = user_id);

-- 9. SEARCH HISTORY (recent searches like MakeMyTrip)
CREATE TABLE public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  search_type TEXT NOT NULL, -- 'flight','hotel','tour'
  search_params JSONB NOT NULL, -- {from, to, date, guests, etc.}
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their search history" ON public.search_history
  FOR ALL USING (auth.uid() = user_id);

-- 10. NOTIFICATIONS (in-app notifications)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info','success','warning','promo','booking','payment'
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- 11. OFFERS / DEALS MANAGEMENT (MakeMyTrip deals section)
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  offer_type TEXT NOT NULL, -- 'discount','cashback','free_upgrade','combo'
  applicable_to TEXT[] DEFAULT '{}', -- ['hotel','flight','tour']
  discount_value NUMERIC,
  discount_type TEXT, -- 'percentage','flat'
  terms_conditions TEXT,
  banner_image TEXT,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active offers" ON public.offers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage offers" ON public.offers
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 12. TRAVELER SAVED CARDS (tokenized, no raw card data)
CREATE TABLE public.saved_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  method_type TEXT NOT NULL, -- 'card','upi','wallet'
  display_name TEXT NOT NULL, -- 'HDFC Visa ****1234'
  last_four TEXT,
  card_brand TEXT, -- 'visa','mastercard','rupay'
  gateway_token TEXT, -- tokenized reference from payment gateway
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their payment methods" ON public.saved_payment_methods
  FOR ALL USING (auth.uid() = user_id);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contact_submissions_updated_at BEFORE UPDATE ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
