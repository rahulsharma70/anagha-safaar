import { useState } from 'react';
import { useBooking } from '@/contexts/BookingContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, Smartphone, Building2, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const PaymentStep = () => {
  const { bookingData, getTotalPrice, clearBooking, prevStep } = useBooking();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking' | 'wallet'>('card');
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!user || !bookingData) {
      toast.error('Please login to continue');
      return;
    }

    setProcessing(true);

    try {
      // Generate booking reference
      const bookingRef = `BK${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create booking in database
      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          user_id: user.id,
          item_type: bookingData.type,
          item_id: bookingData.itemId,
          booking_reference: bookingRef,
          start_date: bookingData.tripSelection.startDate?.toISOString().split('T')[0],
          end_date: bookingData.tripSelection.endDate?.toISOString().split('T')[0] || null,
          guests_count: bookingData.tripSelection.guestsCount,
          total_amount: getTotalPrice(),
          guest_details: bookingData.guestDetails as any,
          status: 'confirmed',
          payment_status: 'completed',
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Booking confirmed successfully!');
      
      // Clear booking state
      clearBooking();
      
      // Navigate to confirmation page
      navigate(`/booking/confirmation/${data.id}`, { 
        state: { bookingReference: bookingRef } 
      });
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to complete booking. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Payment</h2>
        <p className="text-muted-foreground">
          Choose your preferred payment method
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Amount to Pay</CardTitle>
          <CardDescription className="text-3xl font-bold text-primary pt-2">
            ₹{getTotalPrice().toLocaleString()}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Credit/Debit Card</p>
                    <p className="text-sm text-muted-foreground">Visa, Mastercard, Amex</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="upi" id="upi" />
                <Label htmlFor="upi" className="flex items-center gap-3 cursor-pointer flex-1">
                  <Smartphone className="h-5 w-5" />
                  <div>
                    <p className="font-medium">UPI</p>
                    <p className="text-sm text-muted-foreground">PhonePe, Google Pay, Paytm</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="netbanking" id="netbanking" />
                <Label htmlFor="netbanking" className="flex items-center gap-3 cursor-pointer flex-1">
                  <Building2 className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Net Banking</p>
                    <p className="text-sm text-muted-foreground">All major banks</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="wallet" id="wallet" />
                <Label htmlFor="wallet" className="flex items-center gap-3 cursor-pointer flex-1">
                  <Wallet className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Wallets</p>
                    <p className="text-sm text-muted-foreground">Paytm, PhonePe, Amazon Pay</p>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="bg-muted">
        <CardContent className="pt-6">
          <p className="text-sm text-center text-muted-foreground">
            Your payment is secured with 256-bit SSL encryption
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep} disabled={processing}>
          Back
        </Button>
        <Button onClick={handlePayment} size="lg" disabled={processing}>
          {processing ? 'Processing...' : `Pay ₹${getTotalPrice().toLocaleString()}`}
        </Button>
      </div>
    </div>
  );
};
