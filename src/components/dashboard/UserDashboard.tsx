import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  MapPin, 
  Plane, 
  Hotel, 
  Camera,
  Download,
  Star,
  Clock,
  CreditCard,
  Settings,
  Bell,
  Heart,
  Shield,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface UserBooking {
  id: string;
  item_id: string;
  item_type: 'hotel' | 'flight' | 'tour';
  start_date: string;
  end_date?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'failed';
  payment_status: 'paid' | 'pending' | 'failed' | 'refunded';
  total_amount: number;
  currency: string;
  booking_reference: string;
  guests_count: number;
  created_at: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  loyalty_points?: number;
}

interface TravelStats {
  totalTrips: number;
  totalSpent: number;
  favoriteDestinations: string[];
  averageTripDuration: number;
  loyaltyTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

const UserDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [travelStats, setTravelStats] = useState<TravelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingBooking, setPayingBooking] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;
      setBookings((bookingsData || []) as UserBooking[]);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData as UserProfile);

      const stats = calculateTravelStats((bookingsData || []) as UserBooking[]);
      setTravelStats(stats);

    } catch (error) {
      logger.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayLater = async (bookingId: string) => {
    setPayingBooking(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          payment_status: 'paid' 
        })
        .eq('id', bookingId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success('Booking confirmed! Payment marked as completed.');
      fetchUserData(); // Refresh data
    } catch (error) {
      logger.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    } finally {
      setPayingBooking(null);
    }
  };

  const calculateTravelStats = (bookings: UserBooking[]): TravelStats => {
    const totalTrips = bookings.filter(booking => booking.status === 'confirmed').length;
    const totalSpent = bookings.reduce((acc, booking) => acc + booking.total_amount, 0);

    // Basic logic to determine favorite destinations (most frequent)
    const destinationCounts: { [key: string]: number } = {};
    bookings.forEach(booking => {
      destinationCounts[booking.item_type] = (destinationCounts[booking.item_type] || 0) + 1;
    });

    const favoriteDestinations = Object.entries(destinationCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 3)
      .map(([destination]) => destination);

    // Calculate average trip duration in days
    const totalDuration = bookings.reduce((acc, booking) => {
      const startDate = new Date(booking.start_date);
      const endDate = booking.end_date ? new Date(booking.end_date) : startDate;
      const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
      return acc + duration;
    }, 0);
    const averageTripDuration = totalTrips > 0 ? totalDuration / totalTrips : 0;

    // Determine loyalty tier based on total trips
    let loyaltyTier: TravelStats['loyaltyTier'] = 'Bronze';
    if (totalTrips >= 5) {
      loyaltyTier = 'Silver';
    }
    if (totalTrips >= 10) {
      loyaltyTier = 'Gold';
    }
    if (totalTrips >= 20) {
      loyaltyTier = 'Platinum';
    }

    return {
      totalTrips,
      totalSpent,
      favoriteDestinations,
      averageTripDuration,
      loyaltyTier,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'failed': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'hotel': return <Hotel className="h-4 w-4" />;
      case 'flight': return <Plane className="h-4 w-4" />;
      case 'tour': return <Camera className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const downloadBookingDetails = (booking: UserBooking) => {
    const data = {
      bookingReference: booking.booking_reference,
      itemType: booking.item_type,
      itemId: booking.item_id,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading your dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            My Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {profile?.full_name || user?.email}!
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link to="/dashboard/settings">
            <Button variant="outline" size="sm" className="hover-scale">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
          <Link to="/dashboard/notifications">
            <Button variant="outline" size="sm" className="hover-scale">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
          </Link>
        </div>
      </div>

      {/* Profile Card */}
      {profile && (
        <Card className="hover-scale overflow-hidden border-2">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-4">
              <Avatar className="h-20 w-20 border-4 border-primary/20">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-accent text-white">
                  {profile.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl font-semibold">{profile.full_name}</h2>
                <p className="text-muted-foreground text-sm">{profile.email}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                  <Badge variant="outline" className="flex items-center space-x-1 gradient-gold">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{travelStats?.loyaltyTier} Member</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Member since {new Date(profile.created_at!).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="text-center bg-gradient-to-br from-primary/10 to-accent/10 p-4 rounded-lg">
                <div className="text-3xl font-bold text-primary">{profile.loyalty_points || 0}</div>
                <div className="text-xs text-muted-foreground font-medium">Loyalty Points</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {travelStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-scale border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <MapPin className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{travelStats.totalTrips}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed bookings</p>
            </CardContent>
          </Card>

          <Card className="hover-scale border-l-4 border-l-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <CreditCard className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">₹{travelStats.totalSpent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="hover-scale border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Trip Duration</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">
                {travelStats.averageTripDuration.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Days per trip</p>
            </CardContent>
          </Card>

          <Card className="hover-scale border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loyalty Tier</CardTitle>
              <Star className="h-4 w-4 text-purple-500 fill-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-500">{travelStats.loyaltyTier}</div>
              <p className="text-xs text-muted-foreground mt-1">Current tier</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="bookings">My Bookings</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground mb-6">Start planning your next adventure!</p>
                  <Link to="/">
                    <Button variant="hero">Explore Destinations</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <div 
                      key={booking.id} 
                      className="flex flex-col md:flex-row md:items-center justify-between p-5 border-2 rounded-xl hover:border-primary/50 transition-all hover:shadow-md"
                    >
                      <div className="flex items-start space-x-4 mb-4 md:mb-0">
                        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex-shrink-0">
                          {getItemIcon(booking.item_type)}
                        </div>
                        <div>
                          <div className="font-semibold text-lg">
                            {booking.item_type.charAt(0).toUpperCase() + booking.item_type.slice(1)}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(booking.start_date).toLocaleDateString()} 
                            {booking.end_date && ` - ${new Date(booking.end_date).toLocaleDateString()}`}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 font-mono">
                            Ref: {booking.booking_reference}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:justify-end space-x-4">
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">
                            {booking.currency} {booking.total_amount.toLocaleString()}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                            <Badge variant="outline">
                              {booking.payment_status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {booking.status === 'pending' && booking.payment_status === 'pending' && (
                            <Button
                              size="sm"
                              variant="default"
                              className="whitespace-nowrap"
                              onClick={() => handlePayLater(booking.id)}
                              disabled={payingBooking === booking.id}
                            >
                              {payingBooking === booking.id ? (
                                <>Processing...</>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Mark as Paid
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadBookingDetails(booking)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites">
          <Card>
            <CardHeader>
              <CardTitle>Favorites</CardTitle>
              <CardContent>
                Feature comming soon
              </CardContent>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
              <CardContent>
                Feature comming soon
              </CardContent>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardContent>
                Feature comming soon
              </CardContent>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserDashboard;
