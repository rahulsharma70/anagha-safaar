import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Users, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import PaymentModal from '@/components/PaymentModal';
import { bookingService, BookingRequest } from '@/lib/api/booking';

const bookingSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().optional(),
  guestsCount: z.number().min(1, 'At least 1 guest required'),
  specialRequests: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  itemId: string;
  itemType: 'hotel' | 'flight' | 'tour';
  itemName: string;
  startDate: string;
  endDate?: string;
  basePrice: number;
  currency: string;
  userId: string;
  onBookingSuccess: (bookingId: string) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({
  itemId,
  itemType,
  itemName,
  startDate,
  endDate,
  basePrice,
  currency,
  userId,
  onBookingSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [guestsCount, setGuestsCount] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      guestsCount: 1,
    },
  });

  const watchedGuestsCount = watch('guestsCount');
  const totalAmount = basePrice * guestsCount;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);

    try {
      const bookingRequest: BookingRequest = {
        itemId,
        itemType,
        userId,
        startDate,
        endDate,
        guestsCount: data.guestsCount,
        totalAmount,
        currency,
        guestDetails: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
        },
      };

      const booking = await bookingService.createBooking(bookingRequest);
      setBookingData({
        ...booking,
        itemName,
        guestDetails: data,
      });
      setShowPaymentModal(true);

      toast.success('Booking created successfully! Please complete payment.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentDetails: any) => {
    try {
      if (!bookingData) return;

      const confirmedBooking = await bookingService.confirmPayment(
        bookingData.id,
        paymentDetails
      );

      toast.success('Payment successful! Booking confirmed.');
      setShowPaymentModal(false);
      onBookingSuccess(confirmedBooking.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to confirm payment');
    }
  };

  const handlePaymentFailure = (error: string) => {
    toast.error(`Payment failed: ${error}`);
    setShowPaymentModal(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Book Now
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Booking Summary */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h3 className="font-semibold">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item:</span>
                  <span className="font-medium">{itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="secondary">{itemType.toUpperCase()}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date:</span>
                  <span className="font-medium">{new Date(startDate).toLocaleDateString()}</span>
                </div>
                {endDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End Date:</span>
                    <span className="font-medium">{new Date(endDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Price:</span>
                  <span className="font-medium">{formatAmount(basePrice)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span className="text-lg text-accent">{formatAmount(totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Guest Count */}
            <div className="space-y-2">
              <Label htmlFor="guests">Number of Guests</Label>
              <Select
                value={guestsCount.toString()}
                onValueChange={(value) => {
                  const count = parseInt(value);
                  setGuestsCount(count);
                  setValue('guestsCount', count);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select number of guests" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {num} Guest{num > 1 ? 's' : ''}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.guestsCount && (
                <p className="text-sm text-red-500">{errors.guestsCount.message}</p>
              )}
            </div>

            {/* Guest Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Guest Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="Enter your phone number"
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address (Optional)</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    placeholder="Enter your address"
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500">{errors.address.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                <Textarea
                  id="specialRequests"
                  {...register('specialRequests')}
                  placeholder="Any special requests or notes..."
                  rows={3}
                />
                {errors.specialRequests && (
                  <p className="text-sm text-red-500">{errors.specialRequests.message}</p>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                By proceeding with this booking, you agree to our terms and conditions. 
                Payment is required to confirm your reservation.
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating Booking...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Proceed to Payment - {formatAmount(totalAmount)}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {showPaymentModal && bookingData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          bookingDetails={{
            id: bookingData.id,
            type: itemType,
            name: itemName,
            amount: totalAmount,
            currency: currency,
            customerName: bookingData.guestDetails.name,
            customerEmail: bookingData.guestDetails.email,
            customerPhone: bookingData.guestDetails.phone,
          }}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
        />
      )}
    </>
  );
};

export default BookingForm;