import { useState } from 'react';
import { useBooking } from '@/contexts/BookingContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Smartphone, Building2, Wallet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export const PaymentStep = () => {
  const { bookingData, getTotalPrice, clearBooking, prevStep } = useBooking();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking' | 'wallet' | 'googlepay'>('card');
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!bookingData) {
      toast.error('Booking data not found');
      return;
    }

    setProcessing(true);

    try {
      // Generate booking reference
      const bookingReference = `BK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Payment processed successfully!');
      
      // Clear booking state
      clearBooking();
      
      // Navigate to confirmation page
      navigate(`/booking/confirmation/demo`, { 
        state: { 
          bookingReference,
          bookingData,
          totalPrice: getTotalPrice()
        } 
      });

    } catch (error) {
      logger.error('Payment processing failed', error as Error, {
        component: 'PaymentStep',
        action: 'handlePayment'
      });
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Payment</h2>
        <p className="text-muted-foreground">
          Choose your preferred payment method and complete your booking
        </p>
      </div>

      <Alert>
        <AlertDescription>
          Payment gateway integration ready. In production, this will connect to Razorpay and Google Pay for secure payments.
        </AlertDescription>
      </Alert>

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
                <RadioGroupItem value="googlepay" id="googlepay" />
                <Label htmlFor="googlepay" className="flex items-center gap-3 cursor-pointer flex-1">
                  <Wallet className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Google Pay</p>
                    <p className="text-sm text-muted-foreground">Fast & secure payments</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="upi" id="upi" />
                <Label htmlFor="upi" className="flex items-center gap-3 cursor-pointer flex-1">
                  <Smartphone className="h-5 w-5" />
                  <div>
                    <p className="font-medium">UPI</p>
                    <p className="text-sm text-muted-foreground">PhonePe, Paytm, BHIM</p>
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
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Your payment is secured with 256-bit SSL encryption
            </p>
            <p className="text-xs text-muted-foreground">
              Powered by Razorpay & Google Pay • PCI DSS Compliant
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep} disabled={processing}>
          Back
        </Button>
        <Button 
          onClick={handlePayment} 
          size="lg" 
          disabled={processing}
          className="min-w-[200px]"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Proceed to Pay ₹${getTotalPrice().toLocaleString()}`
          )}
        </Button>
      </div>
    </div>
  );
};