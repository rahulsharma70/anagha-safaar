import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBooking, BookingType } from '@/contexts/BookingContext';
import { BookingFlow } from '@/components/booking/BookingFlow';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const BookingCheckout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { initBooking, bookingData } = useBooking();

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      toast.error('Please login to continue booking');
      navigate('/auth', { state: { from: window.location.pathname + window.location.search } });
      return;
    }

    // Initialize booking if coming with query params
    const type = searchParams.get('type') as BookingType;
    const itemId = searchParams.get('itemId');
    const itemName = searchParams.get('itemName');
    const price = searchParams.get('price');

    if (type && itemId && itemName && price && !bookingData) {
      initBooking(type, itemId, decodeURIComponent(itemName), parseFloat(price));
    }
  }, [user, searchParams, navigate, initBooking, bookingData]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <BookingFlow />
      </main>
      <Footer />
    </div>
  );
};

export default BookingCheckout;
