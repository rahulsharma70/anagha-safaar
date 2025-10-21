import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, CreditCard, Smartphone, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { razorpayClient, PaymentParams } from '@/lib/api/payment';
import { toast } from 'sonner';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingDetails: {
    id: string;
    type: 'hotel' | 'flight' | 'tour';
    name: string;
    amount: number;
    currency: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };
  onSuccess: (paymentDetails: any) => void;
  onFailure: (error: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  bookingDetails,
  onSuccess,
  onFailure,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
  });

  useEffect(() => {
    if (isOpen) {
      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [isOpen]);

  const handlePayment = async () => {
    if (!bookingDetails) return;

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      const paymentParams: PaymentParams = {
        amount: bookingDetails.amount,
        currency: bookingDetails.currency,
        orderId: `order_${Date.now()}`,
        customerId: bookingDetails.id,
        customerName: bookingDetails.customerName,
        customerEmail: bookingDetails.customerEmail,
        customerPhone: bookingDetails.customerPhone,
        description: `${bookingDetails.type.toUpperCase()} booking - ${bookingDetails.name}`,
        bookingId: bookingDetails.id,
      };

      const paymentResponse = await razorpayClient.openPaymentModal(paymentParams);
      
      setPaymentStatus('success');
      toast.success('Payment successful!');
      onSuccess(paymentResponse);
      
    } catch (error: any) {
      setPaymentStatus('failed');
      toast.error(error.message || 'Payment failed');
      onFailure(error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: bookingDetails.currency,
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Complete Payment</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Booking Summary */}
          <div className="space-y-3">
            <h3 className="font-semibold">Booking Summary</h3>
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Booking Type:</span>
                <Badge variant="secondary">{bookingDetails.type.toUpperCase()}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Item:</span>
                <span className="text-sm font-medium">{bookingDetails.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Customer:</span>
                <span className="text-sm font-medium">{bookingDetails.customerName}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total Amount:</span>
                <span className="text-lg text-accent">{formatAmount(bookingDetails.amount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upi">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    UPI (Google Pay, PhonePe, Paytm)
                  </div>
                </SelectItem>
                <SelectItem value="card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Credit/Debit Card
                  </div>
                </SelectItem>
                <SelectItem value="netbanking">Net Banking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method Specific Fields */}
          {paymentMethod === 'upi' && (
            <div className="space-y-3">
              <Label htmlFor="upi-id">UPI ID (Optional)</Label>
              <Input
                id="upi-id"
                placeholder="yourname@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use your default UPI app
              </p>
            </div>
          )}

          {paymentMethod === 'card' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="card-number">Card Number</Label>
                <Input
                  id="card-number"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                  <Input
                    id="expiry"
                    placeholder="12/25"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="card-name">Cardholder Name</Label>
                <Input
                  id="card-name"
                  placeholder="John Doe"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Payment Status */}
          {paymentStatus === 'processing' && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Processing your payment...
              </AlertDescription>
            </Alert>
          )}

          {paymentStatus === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Payment successful! Your booking has been confirmed.
              </AlertDescription>
            </Alert>
          )}

          {paymentStatus === 'failed' && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Payment failed. Please try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `Pay ${formatAmount(bookingDetails.amount)}`
              )}
            </Button>
          </div>

          {/* Security Notice */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3 inline mr-1" />
              Your payment is secured by Razorpay
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentModal;
