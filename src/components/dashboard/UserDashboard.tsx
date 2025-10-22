// src/components/dashboard/UserDashboard.tsx
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
  Heart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

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
  preferences?: {
    currency: string;
    language: string;
    notifications: boolean;
    marketing: boolean;
  };
  loyalty_points: number;
  member_since: string;
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

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Fetch user bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;
      setBookings((bookingsData || []) as UserBooking[]);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData as UserProfile);

      // Calculate travel stats
      const stats = calculateTravelStats((bookingsData || []) as UserBooking[]);
      setTravelStats(stats);

    } catch (error) {
      logger.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTravelStats = (bookings: UserBooking[]): TravelStats => {
    const totalTrips = bookings.filter(b => b.status === 'confirmed').length;
    const totalSpent = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.total_amount, 0);
    
    const destinations = bookings.map(b => b.item_id);
    const favoriteDestinations = [...new Set(destinations)].slice(0, 3);
    
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const averageTripDuration = confirmedBookings.length > 0 
      ? confirmedBookings.reduce((sum, b) => {
          const start = new Date(b.start_date);
          const end = new Date(b.end_date || b.start_date);
          return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / confirmedBookings.length
      : 0;

    // Calculate loyalty tier based on total spent
    let loyaltyTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' = 'Bronze';
    if (totalSpent >= 100000) loyaltyTier = 'Platinum';
    else if (totalSpent >= 50000) loyaltyTier = 'Gold';
    else if (totalSpent >= 20000) loyaltyTier = 'Silver';

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
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-gray-100 text-gray-800';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.full_name || user?.email}!</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      {profile && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback>{profile.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{profile.full_name}</h2>
                <p className="text-muted-foreground">{profile.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Star className="h-3 w-3" />
                    <span>{travelStats?.loyaltyTier}</span>
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Member since {new Date(profile.member_since).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{profile.loyalty_points || 0}</div>
                <div className="text-sm text-muted-foreground">Loyalty Points</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {travelStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{travelStats.totalTrips}</div>
              <p className="text-xs text-muted-foreground">Completed bookings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{travelStats.totalSpent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Trip Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{travelStats.averageTripDuration.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Days per trip</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loyalty Tier</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{travelStats.loyaltyTier}</div>
              <p className="text-xs text-muted-foreground">Current tier</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookings">My Bookings</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground mb-4">Start planning your next adventure!</p>
                  <Button>Explore Destinations</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                          {getItemIcon(booking.item_type)}
                        </div>
                        <div>
                          <div className="font-semibold">
                            {booking.item_type.charAt(0).toUpperCase() + booking.item_type.slice(1)} - {booking.item_id}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {booking.start_date} {booking.end_date && `to ${booking.end_date}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Ref: {booking.booking_reference}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-semibold">{booking.currency} {booking.total_amount.toLocaleString()}</div>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadBookingDetails(booking)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Favorite Destinations</CardTitle>
            </CardHeader>
            <CardContent>
              {travelStats?.favoriteDestinations.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
                  <p className="text-muted-foreground">Start exploring and add destinations to your favorites!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {travelStats?.favoriteDestinations.map((destination, index) => (
                    <Card key={destination} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{destination}</h3>
                            <p className="text-sm text-muted-foreground">#{index + 1} favorite</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                <p className="text-muted-foreground">Share your travel experiences with others!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personalized Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Discover New Places</h3>
                <p className="text-muted-foreground mb-4">Based on your travel history and preferences</p>
                <Button>Get Recommendations</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserDashboard;
