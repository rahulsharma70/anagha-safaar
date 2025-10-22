import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Download, Home, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const BookingConfirmationPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const bookingReference = location.state?.bookingReference;

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (error) throw error;
        setBooking(data);
      } catch (error) {
        console.error('Error fetching booking:', error);
        toast.error('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse">Loading booking details...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">Booking not found</p>
              <Button onClick={() => navigate('/')}>Go Home</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const guestDetails = booking.guest_details as any[];
  const primaryGuest = guestDetails?.[0];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/30 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 rounded-full p-4">
                <CheckCircle2 className="h-16 w-16 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground">
              Your {booking.item_type} booking has been confirmed successfully
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Booking Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-primary/5 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Reference Number</p>
                <p className="text-2xl font-bold text-primary font-mono">
                  {bookingReference || booking.booking_reference}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Check-in / Departure</p>
                  <p className="font-medium">
                    {booking.start_date && format(new Date(booking.start_date), 'PPP')}
                  </p>
                </div>
                {booking.end_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Check-out / Return</p>
                    <p className="font-medium">
                      {format(new Date(booking.end_date), 'PPP')}
                    </p>
                  </div>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Number of Guests</p>
                <p className="font-medium">{booking.guests_count}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Total Amount Paid</p>
                <p className="text-2xl font-bold text-primary">
                  ₹{booking.total_amount.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {primaryGuest && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Primary Guest Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {primaryGuest.firstName} {primaryGuest.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{primaryGuest.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{primaryGuest.phone}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-6 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="font-medium mb-1">Confirmation Email Sent</p>
                  <p className="text-sm text-muted-foreground">
                    A confirmation email with your booking details and voucher has been sent to{' '}
                    {primaryGuest?.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
            <Button onClick={() => navigate('/dashboard')}>
              View My Bookings
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingConfirmationPage;
