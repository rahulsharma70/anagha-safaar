-- Payment System Migration for Anagha Safaar
-- This migration adds tables for payment orders, refunds, notifications, and webhook handling

-- Create payment orders table
CREATE TABLE public.payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Amount in paise
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed', 'cancelled')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on payment orders
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment orders"
  ON public.payment_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = payment_orders.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Payment orders can be inserted by system"
  ON public.payment_orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Payment orders can be updated by system"
  ON public.payment_orders FOR UPDATE
  WITH CHECK (true);

-- Create payment refunds table
CREATE TABLE public.payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id TEXT UNIQUE NOT NULL,
  payment_id TEXT NOT NULL,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Amount in paise
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'processed', 'failed', 'cancelled')),
  razorpay_refund_id TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on payment refunds
ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment refunds"
  ON public.payment_refunds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = payment_refunds.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Payment refunds can be inserted by system"
  ON public.payment_refunds FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Payment refunds can be updated by system"
  ON public.payment_refunds FOR UPDATE
  WITH CHECK (true);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'push', 'webhook')),
  recipient TEXT NOT NULL,
  subject TEXT,
  message TEXT,
  template_id TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (
    recipient = auth.jwt() ->> 'email' OR
    recipient = auth.jwt() ->> 'phone'
  );

CREATE POLICY "Notifications can be inserted by system"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Notifications can be updated by system"
  ON public.notifications FOR UPDATE
  WITH CHECK (true);

-- Create webhook events table
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  source TEXT NOT NULL, -- 'razorpay', 'sendgrid', 'twilio', etc.
  event_id TEXT UNIQUE NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on webhook events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Webhook events are viewable by admins only"
  ON public.webhook_events FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Webhook events can be inserted by system"
  ON public.webhook_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Webhook events can be updated by system"
  ON public.webhook_events FOR UPDATE
  WITH CHECK (true);

-- Add new columns to existing bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS 
  add_ons JSONB DEFAULT '{}'::jsonb,
  payment_data JSONB DEFAULT '{}'::jsonb,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  refund_initiated BOOLEAN DEFAULT false,
  refund_amount DECIMAL(10, 2),
  refund_id TEXT,
  refunded_at TIMESTAMPTZ,
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
CREATE INDEX IF NOT EXISTS idx_payment_orders_booking_id ON public.payment_orders(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_id ON public.payment_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON public.payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON public.payment_orders(created_at);

CREATE INDEX IF NOT EXISTS idx_payment_refunds_booking_id ON public.payment_refunds(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_refund_id ON public.payment_refunds(refund_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_status ON public.payment_refunds(status);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_created_at ON public.payment_refunds(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_webhook_events_source ON public.webhook_events(source);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON public.webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at);

CREATE INDEX IF NOT EXISTS idx_bookings_razorpay_payment_id ON public.bookings(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_paid_at ON public.bookings(paid_at);
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_at ON public.bookings(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_refund_initiated ON public.bookings(refund_initiated);

-- Create function to process Razorpay webhook
CREATE OR REPLACE FUNCTION public.process_razorpay_webhook(
  p_event_type TEXT,
  p_event_id TEXT,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  result JSONB;
  booking_record RECORD;
  payment_order_record RECORD;
BEGIN
  -- Store webhook event
  INSERT INTO public.webhook_events (
    event_type,
    source,
    event_id,
    payload
  ) VALUES (
    p_event_type,
    'razorpay',
    p_event_id,
    p_payload
  );

  -- Process payment.paid event
  IF p_event_type = 'payment.paid' THEN
    -- Get payment details from payload
    DECLARE
      payment_id TEXT := p_payload->>'id';
      order_id TEXT := p_payload->'order_id'->>'id';
      amount INTEGER := (p_payload->>'amount')::INTEGER;
      currency TEXT := p_payload->>'currency';
      status TEXT := p_payload->>'status';
    BEGIN
      -- Update payment order
      UPDATE public.payment_orders 
      SET 
        status = 'paid',
        razorpay_payment_id = payment_id,
        razorpay_signature = p_payload->>'signature',
        updated_at = now()
      WHERE razorpay_order_id = order_id;

      -- Get booking ID from payment order
      SELECT booking_id INTO payment_order_record
      FROM public.payment_orders 
      WHERE razorpay_order_id = order_id;

      IF payment_order_record.booking_id IS NOT NULL THEN
        -- Update booking status
        UPDATE public.bookings 
        SET 
          status = 'confirmed',
          payment_status = 'paid',
          razorpay_payment_id = payment_id,
          paid_at = now(),
          updated_at = now()
        WHERE id = payment_order_record.booking_id;

        -- Get booking details for notifications
        SELECT * INTO booking_record
        FROM public.bookings 
        WHERE id = payment_order_record.booking_id;

        -- Send confirmation notifications
        PERFORM public.send_booking_confirmation_notifications(booking_record);
      END IF;
    END;
  END IF;

  -- Process payment.failed event
  IF p_event_type = 'payment.failed' THEN
    DECLARE
      payment_id TEXT := p_payload->>'id';
      order_id TEXT := p_payload->'order_id'->>'id';
    BEGIN
      -- Update payment order
      UPDATE public.payment_orders 
      SET 
        status = 'failed',
        updated_at = now()
      WHERE razorpay_order_id = order_id;

      -- Get booking ID from payment order
      SELECT booking_id INTO payment_order_record
      FROM public.payment_orders 
      WHERE razorpay_order_id = order_id;

      IF payment_order_record.booking_id IS NOT NULL THEN
        -- Update booking status
        UPDATE public.bookings 
        SET 
          status = 'payment_failed',
          payment_status = 'pending',
          updated_at = now()
        WHERE id = payment_order_record.booking_id;
      END IF;
    END;
  END IF;

  -- Mark webhook as processed
  UPDATE public.webhook_events 
  SET 
    processed = true,
    processed_at = now()
  WHERE event_id = p_event_id;

  result := jsonb_build_object(
    'success', true,
    'message', 'Webhook processed successfully'
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Mark webhook as failed
    UPDATE public.webhook_events 
    SET 
      processed = true,
      processed_at = now(),
      error_message = SQLERRM
    WHERE event_id = p_event_id;

    result := jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );

    RETURN result;
END;
$$;

-- Create function to send booking confirmation notifications
CREATE OR REPLACE FUNCTION public.send_booking_confirmation_notifications(
  p_booking RECORD
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  guest_email TEXT;
  guest_phone TEXT;
BEGIN
  -- Extract guest contact information
  guest_email := p_booking.guest_details->0->>'email';
  guest_phone := p_booking.guest_details->0->>'phone';

  -- Send email notification
  IF guest_email IS NOT NULL THEN
    INSERT INTO public.notifications (
      type,
      recipient,
      subject,
      template_id,
      data,
      status
    ) VALUES (
      'email',
      guest_email,
      'Booking Confirmation - ' || p_booking.booking_reference,
      'booking_confirmation',
      jsonb_build_object(
        'booking_reference', p_booking.booking_reference,
        'item_name', p_booking.metadata->>'item_name',
        'start_date', p_booking.start_date,
        'end_date', p_booking.end_date,
        'total_amount', p_booking.total_amount,
        'guest_details', p_booking.guest_details
      ),
      'pending'
    );
  END IF;

  -- Send SMS notification
  IF guest_phone IS NOT NULL THEN
    INSERT INTO public.notifications (
      type,
      recipient,
      message,
      status
    ) VALUES (
      'sms',
      guest_phone,
      'Your booking ' || p_booking.booking_reference || ' is confirmed! Total: ₹' || p_booking.total_amount,
      'pending'
    );
  END IF;
END;
$$;

-- Create function to process refund
CREATE OR REPLACE FUNCTION public.process_booking_refund(
  p_booking_id UUID,
  p_reason TEXT DEFAULT 'Booking cancellation'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  booking_record RECORD;
  refund_id TEXT;
  result JSONB;
BEGIN
  -- Get booking details
  SELECT * INTO booking_record
  FROM public.bookings 
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Booking not found'
    );
  END IF;

  -- Generate refund ID
  refund_id := 'rfnd_' || extract(epoch from now())::text || '_' || substr(md5(random()::text), 1, 8);

  -- Create refund record
  INSERT INTO public.payment_refunds (
    refund_id,
    payment_id,
    booking_id,
    amount,
    reason,
    status
  ) VALUES (
    refund_id,
    booking_record.razorpay_payment_id,
    p_booking_id,
    booking_record.total_amount * 100, -- Convert to paise
    p_reason,
    'initiated'
  );

  -- Update booking status
  UPDATE public.bookings 
  SET 
    status = 'cancelled',
    payment_status = 'refunded',
    cancelled_at = now(),
    cancellation_reason = p_reason,
    refund_initiated = true,
    refund_amount = booking_record.total_amount,
    refund_id = refund_id,
    refunded_at = now(),
    updated_at = now()
  WHERE id = p_booking_id;

  -- Send cancellation notifications
  PERFORM public.send_cancellation_notifications(booking_record, refund_id);

  result := jsonb_build_object(
    'success', true,
    'refund_id', refund_id,
    'refund_amount', booking_record.total_amount
  );

  RETURN result;
END;
$$;

-- Create function to send cancellation notifications
CREATE OR REPLACE FUNCTION public.send_cancellation_notifications(
  p_booking RECORD,
  p_refund_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  guest_email TEXT;
  guest_phone TEXT;
BEGIN
  -- Extract guest contact information
  guest_email := p_booking.guest_details->0->>'email';
  guest_phone := p_booking.guest_details->0->>'phone';

  -- Send email notification
  IF guest_email IS NOT NULL THEN
    INSERT INTO public.notifications (
      type,
      recipient,
      subject,
      template_id,
      data,
      status
    ) VALUES (
      'email',
      guest_email,
      'Booking Cancelled - ' || p_booking.booking_reference,
      'booking_cancellation',
      jsonb_build_object(
        'booking_reference', p_booking.booking_reference,
        'refund_id', p_refund_id,
        'refund_amount', p_booking.total_amount,
        'cancellation_reason', p_booking.cancellation_reason
      ),
      'pending'
    );
  END IF;

  -- Send SMS notification
  IF guest_phone IS NOT NULL THEN
    INSERT INTO public.notifications (
      type,
      recipient,
      message,
      status
    ) VALUES (
      'sms',
      guest_phone,
      'Your booking ' || p_booking.booking_reference || ' has been cancelled. Refund: ₹' || p_booking.total_amount,
      'pending'
    );
  END IF;
END;
$$;

-- Create updated_at triggers
CREATE TRIGGER update_payment_orders_updated_at BEFORE UPDATE ON public.payment_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_refunds_updated_at BEFORE UPDATE ON public.payment_refunds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to cleanup old webhook events
CREATE OR REPLACE FUNCTION public.cleanup_old_webhook_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Delete webhook events older than 30 days
  DELETE FROM public.webhook_events 
  WHERE created_at < now() - interval '30 days';
  
  -- Log cleanup
  INSERT INTO public.notifications (
    type,
    recipient,
    subject,
    message,
    status
  ) VALUES (
    'webhook',
    'system',
    'Webhook Cleanup',
    'Cleaned up old webhook events',
    'sent'
  );
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create view for payment summary
CREATE VIEW public.payment_summary AS
SELECT 
  po.id as payment_order_id,
  po.order_id,
  po.amount,
  po.currency,
  po.status as payment_status,
  po.created_at as payment_created_at,
  b.id as booking_id,
  b.booking_reference,
  b.user_id,
  b.item_type,
  b.item_id,
  b.total_amount,
  b.status as booking_status,
  pr.refund_id,
  pr.refund_amount,
  pr.status as refund_status
FROM public.payment_orders po
LEFT JOIN public.bookings b ON po.booking_id = b.id
LEFT JOIN public.payment_refunds pr ON b.id = pr.booking_id;

-- Enable RLS on payment summary view
ALTER VIEW public.payment_summary SET (security_invoker = true);

-- Create function to get booking analytics with payment data
CREATE OR REPLACE FUNCTION public.get_booking_payment_analytics(
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
        'payment_failed', count(*) FILTER (WHERE status = 'payment_failed')
      )
      FROM public.bookings 
      WHERE created_at::date BETWEEN p_start_date AND p_end_date
    ),
    'payments', (
      SELECT jsonb_build_object(
        'total_amount', sum(total_amount),
        'paid_amount', sum(total_amount) FILTER (WHERE payment_status = 'paid'),
        'refunded_amount', sum(refund_amount) FILTER (WHERE refund_initiated = true),
        'average_amount', avg(total_amount) FILTER (WHERE payment_status = 'paid')
      )
      FROM public.bookings 
      WHERE created_at::date BETWEEN p_start_date AND p_end_date
    ),
    'refunds', (
      SELECT jsonb_build_object(
        'total_refunds', count(*),
        'total_refund_amount', sum(amount),
        'average_refund_amount', avg(amount)
      )
      FROM public.payment_refunds 
      WHERE created_at::date BETWEEN p_start_date AND p_end_date
    ),
    'notifications', (
      SELECT jsonb_build_object(
        'total_sent', count(*),
        'emails_sent', count(*) FILTER (WHERE type = 'email'),
        'sms_sent', count(*) FILTER (WHERE type = 'sms'),
        'delivery_rate', 
          CASE 
            WHEN count(*) > 0 THEN 
              (count(*) FILTER (WHERE status = 'delivered')::float / count(*) * 100)
            ELSE 0 
          END
      )
      FROM public.notifications 
      WHERE created_at::date BETWEEN p_start_date AND p_end_date
    )
  ) INTO result;
  
  RETURN result;
END;
$$;
