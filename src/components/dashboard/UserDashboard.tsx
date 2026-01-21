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
  Star,
  Clock,
  CreditCard,
  Settings,
  Bell,
  Heart,
  Gift,
  Users,
  FileText,
  User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { Link } from 'react-router-dom';
import { LoyaltyPoints } from '@/components/loyalty/LoyaltyPoints';
import { ReferralSystem } from '@/components/referral/ReferralSystem';
import { ProfileManagement } from '@/components/profile/ProfileManagement';
import { BookingManagementCard } from '@/components/booking/BookingManagementCard';
import { LoyaltyRewards } from '@/components/loyalty/LoyaltyRewards';
import { UserReviews } from '@/components/reviews/UserReviews';

interface UserBooking {
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

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at?: string;
}

interface TravelStats {
  totalTrips: number;
  totalSpent: number;
  averageTripDuration: number;
  loyaltyTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

const UserDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [travelStats, setTravelStats] = useState<TravelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loyaltyData, setLoyaltyData] = useState({ points: 0, tier: 'bronze' as const });
  const [activeTab, setActiveTab] = useState('overview');

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

      // Fetch loyalty points
      const { data: loyaltyPoints } = await (supabase as any)
        .from('loyalty_points')
        .select('points, tier')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (loyaltyPoints) {
        setLoyaltyData(loyaltyPoints);
      }

    } catch (error) {
      logger.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTravelStats = (bookings: UserBooking[]): TravelStats => {
    const confirmedBookings = bookings.filter(booking => booking.status === 'confirmed' || booking.status === 'completed');
    const totalTrips = confirmedBookings.length;
    const totalSpent = bookings.reduce((acc, booking) => acc + booking.total_amount, 0);

    // Calculate average trip duration in days
    const totalDuration = confirmedBookings.reduce((acc, booking) => {
      const startDate = new Date(booking.start_date);
      const endDate = booking.end_date ? new Date(booking.end_date) : startDate;
      const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
      return acc + duration;
    }, 0);
    const averageTripDuration = totalTrips > 0 ? totalDuration / totalTrips : 0;

    // Determine loyalty tier based on total trips
    let loyaltyTier: TravelStats['loyaltyTier'] = 'Bronze';
    if (totalTrips >= 5) loyaltyTier = 'Silver';
    if (totalTrips >= 10) loyaltyTier = 'Gold';
    if (totalTrips >= 20) loyaltyTier = 'Platinum';

    return { totalTrips, totalSpent, averageTripDuration, loyaltyTier };
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

      {/* Profile Summary Card */}
      {profile && (
        <Card className="overflow-hidden border-2">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-accent text-white">
                  {profile.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-semibold">{profile.full_name}</h2>
                <p className="text-muted-foreground">{profile.email}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                  <Badge variant="outline" className="flex items-center gap-1 gradient-gold">
                    <Star className="h-3 w-3 fill-current" />
                    {loyaltyData.tier.charAt(0).toUpperCase() + loyaltyData.tier.slice(1)} Member
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Member since {new Date(profile.created_at!).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="text-center bg-gradient-to-br from-primary/10 to-accent/10 p-6 rounded-xl">
                <div className="text-4xl font-bold text-primary">{loyaltyData.points.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground font-medium">Loyalty Points</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      {travelStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="hover-scale border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Total Trips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{travelStats.totalTrips}</div>
            </CardContent>
          </Card>

          <Card className="hover-scale border-l-4 border-l-accent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-accent" />
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">₹{travelStats.totalSpent.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="hover-scale border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Avg Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">{travelStats.averageTripDuration.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">days</p>
            </CardContent>
          </Card>

          <Link to="/wishlist" className="block">
            <Card className="hover-scale border-l-4 border-l-purple-500 h-full cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4 text-purple-500" />
                  Wishlist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Heart className="h-8 w-8 fill-purple-500 text-purple-500" />
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 lg:w-auto">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Bookings</span>
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-1">
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">Rewards</span>
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Reviews</span>
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Referrals</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Loyalty and Quick Actions */}
          <div className="grid gap-6 lg:grid-cols-2">
            <LoyaltyPoints points={loyaltyData.points} tier={loyaltyData.tier} />
            <ReferralSystem />
          </div>

          {/* Recent Bookings Preview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Bookings
              </CardTitle>
              <Button variant="link" onClick={() => setActiveTab('bookings')}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground mb-6">Start planning your next adventure!</p>
                  <Link to="/">
                    <Button variant="default">Explore Destinations</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.slice(0, 3).map((booking) => (
                    <BookingManagementCard 
                      key={booking.id} 
                      booking={booking} 
                      onUpdate={fetchUserData}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                All Bookings ({bookings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground mb-6">Start planning your next adventure!</p>
                  <Link to="/">
                    <Button variant="default">Explore Destinations</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <BookingManagementCard 
                      key={booking.id} 
                      booking={booking} 
                      onUpdate={fetchUserData}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards">
          <LoyaltyRewards />
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews">
          <UserReviews />
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals">
          <ReferralSystem />
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <ProfileManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserDashboard;
