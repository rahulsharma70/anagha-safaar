-- Add INSERT policy for loyalty_transactions to allow system operations
-- While SECURITY DEFINER triggers bypass RLS, this adds defense-in-depth

-- Create policy for system/service operations to insert loyalty transactions
CREATE POLICY "System can create loyalty transactions"
ON public.loyalty_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add unique constraint to prevent duplicate point awards for same booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_transactions_booking_type 
ON public.loyalty_transactions (booking_id, transaction_type) 
WHERE booking_id IS NOT NULL;