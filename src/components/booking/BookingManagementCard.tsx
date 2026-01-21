import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Calendar, 
  Download, 
  CreditCard, 
  X, 
  Eye, 
  Clock, 
  MapPin, 
  Plane, 
  Hotel, 
  Camera,
  AlertCircle,
  CheckCircle,
  RefreshCcw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Booking {
  id: string;
  item_id: string;
  item_type: 'hotel' | 'flight' | 'tour';
  start_date: string;
  end_date?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  payment_status: 'paid' | 'pending' | 'failed' | 'refunded';
  total_amount: number;
  currency: string;
  booking_reference: string;
  guests_count: number;
  created_at: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  refund_amount?: number;
  refund_status?: string;
}

interface BookingManagementCardProps {
  booking: Booking;
  onUpdate: () => void;
}

export const BookingManagementCard = ({ booking, onUpdate }: BookingManagementCardProps) => {
  const [cancelling, setCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'refunded': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'hotel': return <Hotel className="h-5 w-5" />;
      case 'flight': return <Plane className="h-5 w-5" />;
      case 'tour': return <Camera className="h-5 w-5" />;
      default: return <MapPin className="h-5 w-5" />;
    }
  };

  const calculateRefund = () => {
    const bookingDate = new Date(booking.start_date);
    const today = new Date();
    const daysUntilTrip = Math.floor((bookingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilTrip > 30) {
      return { percentage: 100, amount: booking.total_amount };
    } else if (daysUntilTrip > 14) {
      return { percentage: 75, amount: booking.total_amount * 0.75 };
    } else if (daysUntilTrip > 7) {
      return { percentage: 50, amount: booking.total_amount * 0.5 };
    } else if (daysUntilTrip > 3) {
      return { percentage: 25, amount: booking.total_amount * 0.25 };
    }
    return { percentage: 0, amount: 0 };
  };

  const handleCancelBooking = async () => {
    if (!cancellationReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    setCancelling(true);
    const refundInfo = calculateRefund();

    try {
      // Update booking status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: cancellationReason,
          cancelled_at: new Date().toISOString(),
          refund_amount: refundInfo.amount,
          refund_status: refundInfo.percentage > 0 ? 'pending' : 'none',
        } as any)
        .eq('id', booking.id);

      if (bookingError) throw bookingError;

      // Create booking history entry
      await (supabase as any)
        .from('booking_history')
        .insert({
          booking_id: booking.id,
          action: 'cancelled',
          old_status: booking.status,
          new_status: 'cancelled',
          notes: cancellationReason,
        });

      toast.success(`Booking cancelled. ${refundInfo.percentage > 0 ? `${refundInfo.percentage}% refund (₹${refundInfo.amount.toLocaleString()}) will be processed.` : 'No refund applicable.'}`);
      onUpdate();
    } catch (error) {
      toast.error('Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const handlePayNow = () => {
    window.location.href = `/booking/checkout?type=${booking.item_type}&id=${booking.item_id}&bookingId=${booking.id}&amount=${booking.total_amount}`;
  };

  const downloadBookingDetails = () => {
    const data = {
      bookingReference: booking.booking_reference,
      itemType: booking.item_type,
      startDate: booking.start_date,
      endDate: booking.end_date,
      status: booking.status,
      paymentStatus: booking.payment_status,
      totalAmount: booking.total_amount,
      currency: booking.currency,
      guestsCount: booking.guests_count,
      createdAt: booking.created_at,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-${booking.booking_reference}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const canCancel = booking.status !== 'cancelled' && booking.status !== 'completed' && new Date(booking.start_date) > new Date();
  const refundInfo = calculateRefund();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Booking Info */}
          <div className="flex items-start gap-4">
            <div className={`flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20`}>
              {getItemIcon(booking.item_type)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg capitalize">{booking.item_type} Booking</h3>
                {booking.status === 'confirmed' && booking.payment_status === 'paid' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(new Date(booking.start_date), 'MMM dd, yyyy')}
                {booking.end_date && ` - ${format(new Date(booking.end_date), 'MMM dd, yyyy')}`}
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Ref: {booking.booking_reference}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status}
                </Badge>
                <Badge className={getPaymentStatusColor(booking.payment_status)}>
                  {booking.payment_status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Amount and Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {booking.currency} {booking.total_amount.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                {booking.guests_count} {booking.guests_count === 1 ? 'guest' : 'guests'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* View Details */}
              <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Booking Details</DialogTitle>
                    <DialogDescription>
                      Reference: {booking.booking_reference}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <p className="font-medium capitalize">{booking.item_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Check-in</p>
                        <p className="font-medium">{format(new Date(booking.start_date), 'PPP')}</p>
                      </div>
                      {booking.end_date && (
                        <div>
                          <p className="text-sm text-muted-foreground">Check-out</p>
                          <p className="font-medium">{format(new Date(booking.end_date), 'PPP')}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="font-medium">{booking.currency} {booking.total_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Status</p>
                        <Badge className={getPaymentStatusColor(booking.payment_status)}>{booking.payment_status}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Guests</p>
                        <p className="font-medium">{booking.guests_count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Booked On</p>
                        <p className="font-medium">{format(new Date(booking.created_at), 'PPP')}</p>
                      </div>
                    </div>

                    {booking.cancellation_reason && (
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">Cancellation Reason</p>
                        <p className="text-sm text-red-600 dark:text-red-400">{booking.cancellation_reason}</p>
                        {booking.refund_amount && booking.refund_amount > 0 && (
                          <p className="text-sm mt-2">
                            <span className="font-medium">Refund:</span> {booking.currency} {booking.refund_amount.toLocaleString()} ({booking.refund_status})
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Pay Now */}
              {booking.status === 'pending' && booking.payment_status === 'pending' && (
                <Button size="sm" onClick={handlePayNow}>
                  <CreditCard className="h-4 w-4 mr-1" />
                  Pay Now
                </Button>
              )}

              {/* Download */}
              <Button variant="outline" size="sm" onClick={downloadBookingDetails}>
                <Download className="h-4 w-4" />
              </Button>

              {/* Cancel */}
              {canCancel && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-4">
                        <p>Are you sure you want to cancel this booking?</p>
                        
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-amber-800 dark:text-amber-200">Refund Policy</p>
                              <p className="text-sm text-amber-600 dark:text-amber-400">
                                Based on your trip date, you'll receive a <strong>{refundInfo.percentage}% refund</strong> 
                                {refundInfo.percentage > 0 && (
                                  <span> (₹{refundInfo.amount.toLocaleString()})</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Reason for cancellation *</label>
                          <Textarea
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            placeholder="Please tell us why you're cancelling..."
                            className="min-h-[100px]"
                          />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancelBooking}
                        disabled={cancelling || !cancellationReason.trim()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {cancelling ? (
                          <>
                            <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          'Confirm Cancellation'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
