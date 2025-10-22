import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Lock, 
  Clock, 
  Users, 
  CreditCard, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Shield,
  Timer,
  DollarSign,
  Calendar,
  MapPin,
  Star
} from 'lucide-react';
import { format, differenceInMinutes, addMinutes } from 'date-fns';
import { toast } from 'sonner';
import { 
  bookingLockService, 
  BookingLockType, 
  BookingLock,
  DynamicPricing 
} from '@/lib/booking-lock-service';
import { useAuth } from '@/hooks/useAuth';

interface BookingConfirmationProps {
  itemType: BookingLockType;
  itemId: string;
  itemName: string;
  selectedDate: string;
  onBookingComplete?: (bookingId: string) => void;
  onCancel?: () => void;
  className?: string;
}

interface PaymentData {
  method: 'card' | 'upi' | 'netbanking' | 'wallet';
  details: any;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  itemType,
  itemId,
  itemName,
  selectedDate,
  onBookingComplete,
  onCancel,
  className = ''
}) => {
  const { user } = useAuth();
  const [lockData, setLockData] = useState<BookingLock | null>(null);
  const [loading, setLoading] = useState(false);
  const [extending, setExtending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [step, setStep] = useState<'lock' | 'payment' | 'confirm'>('lock');

  // Lock the item when component mounts
  useEffect(() => {
    if (user && step === 'lock') {
      lockItem();
    }
  }, [user, step]);

  // Update timer every second
  useEffect(() => {
    if (!lockData) return;

    const interval = setInterval(() => {
      const remaining = differenceInMinutes(lockData.expiresAt, new Date());
      setTimeRemaining(Math.max(0, remaining));
      
      if (remaining <= 0) {
        toast.error('Booking session expired');
        onCancel?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockData]);

  // Lock the item
  const lockItem = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const result = await bookingLockService.lockItem(
        itemType,
        itemId,
        user.id,
        `session_${Date.now()}`,
        {
          ipAddress: 'unknown', // Would get from request
          userAgent: navigator.userAgent,
          source: 'web'
        }
      );

      if (result.success && result.lockId) {
        // Get the lock data
        const lock = await bookingLockService.getLockById(result.lockId);
        if (lock) {
          setLockData(lock);
          setStep('payment');
          toast.success('Item locked successfully! Complete your booking within 15 minutes.');
        }
      } else {
        toast.error(result.error || 'Failed to lock item');
        onCancel?.();
      }
    } catch (error) {
      console.error('Failed to lock item:', error);
      toast.error('Failed to lock item');
      onCancel?.();
    } finally {
      setLoading(false);
    }
  };

  // Extend lock
  const extendLock = async () => {
    if (!lockData) return;

    try {
      setExtending(true);
      const result = await bookingLockService.extendLock(lockData.id, user!.id);
      
      if (result.success && result.newExpiry) {
        // Update lock data
        const updatedLock = await bookingLockService.getLockById(lockData.id);
        if (updatedLock) {
          setLockData(updatedLock);
          toast.success('Lock extended by 5 minutes');
        }
      } else {
        toast.error(result.error || 'Failed to extend lock');
      }
    } catch (error) {
      console.error('Failed to extend lock:', error);
      toast.error('Failed to extend lock');
    } finally {
      setExtending(false);
    }
  };

  // Process payment
  const processPayment = async () => {
    if (!lockData) return;

    try {
      setConfirming(true);
      
      // Simulate payment processing
      const paymentResult = await simulatePayment(lockData.pricing.total);
      
      if (paymentResult.success) {
        setPaymentData(paymentResult.data);
        setStep('confirm');
      } else {
        toast.error('Payment failed: ' + paymentResult.error);
      }
    } catch (error) {
      console.error('Payment processing failed:', error);
      toast.error('Payment processing failed');
    } finally {
      setConfirming(false);
    }
  };

  // Confirm booking
  const confirmBooking = async () => {
    if (!lockData || !paymentData) return;

    try {
      setConfirming(true);
      const result = await bookingLockService.confirmBooking(
        lockData.id,
        user!.id,
        paymentData
      );

      if (result.success && result.bookingId) {
        toast.success('Booking confirmed successfully!');
        onBookingComplete?.(result.bookingId);
      } else {
        toast.error(result.error || 'Failed to confirm booking');
      }
    } catch (error) {
      console.error('Failed to confirm booking:', error);
      toast.error('Failed to confirm booking');
    } finally {
      setConfirming(false);
    }
  };

  // Simulate payment processing
  const simulatePayment = async (amount: number): Promise<{ success: boolean; data?: PaymentData; error?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            method: 'card',
            details: {
              transactionId: `txn_${Date.now()}`,
              amount: amount,
              currency: 'INR',
              status: 'completed'
            }
          }
        });
      }, 2000);
    });
  };

  // Release lock
  const releaseLock = async () => {
    if (!lockData) return;

    try {
      await bookingLockService.releaseLock(lockData.id, user!.id);
      toast.success('Booking session cancelled');
      onCancel?.();
    } catch (error) {
      console.error('Failed to release lock:', error);
      toast.error('Failed to cancel booking');
    }
  };

  // Format time remaining
  const formatTimeRemaining = (minutes: number): string => {
    if (minutes <= 0) return 'Expired';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Calculate progress percentage
  const progressPercentage = lockData 
    ? Math.max(0, Math.min(100, (timeRemaining / (BOOKING_CONFIG.LOCK_DURATION_MINUTES + lockData.extensions * BOOKING_CONFIG.EXTEND_LOCK_MINUTES)) * 100))
    : 0;

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-lg font-medium">Securing your booking...</p>
              <p className="text-sm text-gray-600">Please wait while we lock this item for you</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!lockData) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Failed to secure booking. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Lock className="w-5 h-5 mr-2 text-green-600" />
              Booking Confirmation
            </CardTitle>
            <CardDescription>{itemName}</CardDescription>
          </div>
          
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Locked
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Timer and Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Timer className="w-4 h-4 mr-2 text-orange-600" />
              <span className="text-sm font-medium">Time Remaining</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-orange-600">
                {formatTimeRemaining(timeRemaining)}
              </span>
              {lockData.extensions < BOOKING_CONFIG.MAX_LOCK_EXTENSIONS && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={extendLock}
                  disabled={extending}
                >
                  <RefreshCw className={cn("w-3 h-3 mr-1", extending && "animate-spin")} />
                  Extend
                </Button>
              )}
            </div>
          </div>
          
          <Progress value={progressPercentage} className="h-2" />
          
          {lockData.extensions > 0 && (
            <p className="text-xs text-gray-600">
              Extended {lockData.extensions} time(s). Maximum extensions: {BOOKING_CONFIG.MAX_LOCK_EXTENSIONS}
            </p>
          )}
        </div>

        {/* Booking Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Booking Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Date</span>
              </div>
              <p className="font-medium">{format(new Date(selectedDate), 'MMM dd, yyyy')}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                <span className="text-sm">Location</span>
              </div>
              <p className="font-medium">{lockData.itemDetails?.location_city || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Pricing Breakdown</h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Base Price</span>
              <span className="text-sm">₹{lockData.pricing.basePrice}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Taxes (12%)</span>
              <span className="text-sm">₹{lockData.pricing.taxes}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Service Fee (5%)</span>
              <span className="text-sm">₹{lockData.pricing.fees}</span>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between font-semibold">
              <span>Total Amount</span>
              <span className="text-lg">₹{lockData.pricing.total}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Pricing Factors */}
        {lockData.itemDetails?.pricing && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Price Factors</h3>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                <span>Demand</span>
                <Badge variant="outline">+{Math.round((lockData.itemDetails.pricing.factors.demand - 1) * 100)}%</Badge>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span>Season</span>
                <Badge variant="outline">+{Math.round((lockData.itemDetails.pricing.factors.season - 1) * 100)}%</Badge>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                <span>Time</span>
                <Badge variant="outline">+{Math.round((lockData.itemDetails.pricing.factors.timeOfDay - 1) * 100)}%</Badge>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                <span>Advance Booking</span>
                <Badge variant="outline">{Math.round((lockData.itemDetails.pricing.factors.advanceBooking - 1) * 100)}%</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {step === 'payment' && (
            <>
              <Button
                onClick={processPayment}
                disabled={confirming}
                className="flex-1"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {confirming ? 'Processing...' : 'Proceed to Payment'}
              </Button>
              
              <Button
                variant="outline"
                onClick={releaseLock}
              >
                Cancel
              </Button>
            </>
          )}
          
          {step === 'confirm' && (
            <>
              <Button
                onClick={confirmBooking}
                disabled={confirming}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {confirming ? 'Confirming...' : 'Confirm Booking'}
              </Button>
              
              <Button
                variant="outline"
                onClick={releaseLock}
              >
                Cancel
              </Button>
            </>
          )}
        </div>

        {/* Security Notice */}
        <Alert className="border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Secure Booking:</strong> Your item is locked and secured. Complete payment within the time limit to confirm your booking.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

// Import BOOKING_CONFIG from the service
const BOOKING_CONFIG = {
  LOCK_DURATION_MINUTES: 15,
  EXTEND_LOCK_MINUTES: 5,
  MAX_LOCK_EXTENSIONS: 2,
};

export default BookingConfirmation;
