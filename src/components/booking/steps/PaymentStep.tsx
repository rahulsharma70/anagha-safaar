import { useState, useEffect } from 'react';
import { useBooking } from '@/contexts/BookingContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Smartphone, Building2, Wallet, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { BookingAPIService, RazorpayService, NotificationService } from '@/lib/booking-api-service';
import { toast } from 'sonner';

export const PaymentStep = () => {
  const { bookingData, getTotalPrice, clearBooking, prevStep } = useBooking();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking' | 'wallet'>('card');
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    loadRazorpayScript();
  }, []);

  const handlePayment = async () => {
    if (!user || !bookingData) {
      toast.error('Please login to continue');
      return;
    }

    setProcessing(true);
    setPaymentStatus('processing');

    try {
      // Step 1: Create booking record
      const bookingResult = await BookingAPIService.createBooking({
        type: bookingData.type,
        itemId: bookingData.itemId,
        itemName: bookingData.itemName,
        startDate: bookingData.tripSelection.startDate?.toISOString().split('T')[0] || '',
        endDate: bookingData.tripSelection.endDate?.toISOString().split('T')[0],
        guestsCount: bookingData.tripSelection.guestsCount,
        guestDetails: bookingData.guestDetails,
        addOns: bookingData.addOns,
        totalPrice: getTotalPrice(),
        userId: user.id
      });

      if (!bookingResult.success || !bookingResult.bookingId) {
        throw new Error(bookingResult.error || 'Failed to create booking');
      }

      setBookingId(bookingResult.bookingId);

      // Step 2: Create Razorpay order
      const orderResult = await RazorpayService.createOrder(
        getTotalPrice() * 100, // Convert to paise
        'INR',
        {
          bookingId: bookingResult.bookingId,
          itemType: bookingData.type,
          userId: user.id
        }
      );

      if (!orderResult.success || !orderResult.orderId) {
        throw new Error(orderResult.error || 'Failed to create payment order');
      }

      // Step 3: Launch Razorpay payment modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: getTotalPrice() * 100,
        currency: 'INR',
        name: 'Anagha Safaar',
        description: `Booking for ${bookingData.itemName}`,
        order_id: orderResult.orderId,
        prefill: {
          name: bookingData.guestDetails[0]?.firstName + ' ' + bookingData.guestDetails[0]?.lastName,
          email: bookingData.guestDetails[0]?.email,
          contact: bookingData.guestDetails[0]?.phone,
        },
        theme: {
          color: '#3B82F6'
        },
        handler: async function (response: any) {
          await handlePaymentSuccess(response);
        },
        modal: {
          ondismiss: async function() {
            await handlePaymentFailure('Payment cancelled by user');
          }
        }
      };

      const razorpay = (window as any).Razorpay;
      if (razorpay) {
        razorpay.open(options);
      } else {
        throw new Error('Razorpay not loaded');
      }

    } catch (error) {
      console.error('Payment initiation error:', error);
      await handlePaymentFailure(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async (response: any) => {
    try {
      setPaymentStatus('processing');

      // Verify payment signature
      const isValidSignature = RazorpayService.verifyPaymentSignature(
        response.razorpay_order_id,
        response.razorpay_payment_id,
        response.razorpay_signature
      );

      if (!isValidSignature) {
        throw new Error('Invalid payment signature');
      }

      // Update booking status to confirmed
      const updateResult = await BookingAPIService.updateBookingStatus(
        bookingId!,
        'confirmed',
        'paid',
        {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          paid_at: new Date().toISOString()
        }
      );

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update booking status');
      }

      // Get booking details for notifications
      const bookingResult = await BookingAPIService.getBooking(bookingId!);
      if (bookingResult.success && bookingResult.booking) {
        // Send confirmation notifications
        await NotificationService.sendBookingConfirmation(bookingResult.booking);
      }

      setPaymentStatus('success');
      toast.success('Payment successful! Booking confirmed.');

      // Clear booking state
      clearBooking();
      
      // Navigate to confirmation page
      navigate(`/booking/confirmation/${bookingId}`, { 
        state: { 
          bookingReference: bookingResult.booking?.booking_reference,
          paymentId: response.razorpay_payment_id
        } 
      });

    } catch (error) {
      console.error('Payment success handling error:', error);
      await handlePaymentFailure(error instanceof Error ? error.message : 'Payment verification failed');
    }
  };

  const handlePaymentFailure = async (reason: string) => {
    try {
      setPaymentStatus('failed');

      if (bookingId) {
        // Update booking status to payment failed
        await BookingAPIService.updateBookingStatus(
          bookingId,
          'payment_failed',
          'pending'
        );
      }

      toast.error(`Payment failed: ${reason}`);
      
    } catch (error) {
      console.error('Payment failure handling error:', error);
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

      {/* Payment Status Alerts */}
      {paymentStatus === 'processing' && (
        <Alert className="border-blue-200 bg-blue-50">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <AlertDescription className="text-blue-800">
            Processing your payment. Please wait...
          </AlertDescription>
        </Alert>
      )}

      {paymentStatus === 'success' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Payment successful! Redirecting to confirmation page...
          </AlertDescription>
        </Alert>
      )}

      {paymentStatus === 'failed' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Payment failed. Please try again or contact support.
          </AlertDescription>
        </Alert>
      )}

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
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Your payment is secured with 256-bit SSL encryption
            </p>
            <p className="text-xs text-muted-foreground">
              Powered by Razorpay • PCI DSS Compliant
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
          disabled={processing || paymentStatus === 'processing'}
          className="min-w-[200px]"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ₹${getTotalPrice().toLocaleString()}`
          )}
        </Button>
      </div>
    </div>
  );
};
