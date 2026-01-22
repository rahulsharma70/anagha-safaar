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
  Star,
  Clock,
  CreditCard,
  Settings,
  Bell,
  Heart,
  Gift,
  Users,
  User,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  Crown,
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
import { motion } from 'framer-motion';

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

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

    const totalDuration = confirmedBookings.reduce((acc, booking) => {
      const startDate = new Date(booking.start_date);
      const endDate = booking.end_date ? new Date(booking.end_date) : startDate;
      const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
      return acc + duration;
    }, 0);
    const averageTripDuration = totalTrips > 0 ? totalDuration / totalTrips : 0;

    let loyaltyTier: TravelStats['loyaltyTier'] = 'Bronze';
    if (totalTrips >= 5) loyaltyTier = 'Silver';
    if (totalTrips >= 10) loyaltyTier = 'Gold';
    if (totalTrips >= 20) loyaltyTier = 'Platinum';

    return { totalTrips, totalSpent, averageTripDuration, loyaltyTier };
  };

  const getTierColor = (tier: string) => {
    const colors = {
      bronze: 'from-amber-600 to-orange-700',
      silver: 'from-slate-400 to-slate-600',
      gold: 'from-yellow-400 to-amber-500',
      platinum: 'from-violet-400 to-purple-600',
    };
    return colors[tier as keyof typeof colors] || colors.bronze;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
            <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-xl shadow-primary/25">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              My Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.full_name || user?.email}! ✨
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/dashboard/settings">
            <Button variant="outline" size="sm" className="gap-2 bg-card hover:bg-accent border-border/50 shadow-sm">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </Link>
          <Link to="/dashboard/notifications">
            <Button variant="outline" size="sm" className="gap-2 bg-card hover:bg-accent border-border/50 shadow-sm relative">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full animate-pulse" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Profile Summary Card */}
      {profile && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-card via-card to-muted/30 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <CardContent className="p-8 relative">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                {/* Avatar Section */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
                  <Avatar className="h-28 w-28 border-4 border-background shadow-2xl relative">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className={`text-4xl bg-gradient-to-br ${getTierColor(loyaltyData.tier)} text-white`}>
                      {profile.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-gradient-to-br ${getTierColor(loyaltyData.tier)} flex items-center justify-center shadow-lg`}>
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1 text-center lg:text-left space-y-3">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{profile.full_name}</h2>
                    <p className="text-muted-foreground">{profile.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                    <Badge className={`bg-gradient-to-r ${getTierColor(loyaltyData.tier)} text-white border-0 px-4 py-1 text-sm font-medium shadow-md`}>
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      {loyaltyData.tier.charAt(0).toUpperCase() + loyaltyData.tier.slice(1)} Member
                    </Badge>
                    <Badge variant="outline" className="bg-background/50 border-border/50">
                      <Calendar className="h-3 w-3 mr-1" />
                      Member since {new Date(profile.created_at!).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </Badge>
                  </div>
                </div>

                {/* Points Display */}
                <div className="text-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 rounded-2xl border border-primary/10 shadow-inner min-w-[180px]">
                  <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {loyaltyData.points.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium mt-1">Loyalty Points</div>
                  <div className="flex items-center justify-center gap-1 text-emerald-500 text-xs mt-2">
                    <TrendingUp className="h-3 w-3" />
                    <span>+250 this month</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Stats */}
      {travelStats && (
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Total Trips",
              value: travelStats.totalTrips,
              icon: MapPin,
              gradient: "from-violet-500 to-purple-600",
              bgGradient: "from-violet-500/10 to-purple-600/10",
            },
            {
              title: "Total Spent",
              value: `₹${(travelStats.totalSpent / 1000).toFixed(0)}K`,
              icon: CreditCard,
              gradient: "from-emerald-500 to-teal-500",
              bgGradient: "from-emerald-500/10 to-teal-500/10",
            },
            {
              title: "Avg Duration",
              value: `${travelStats.averageTripDuration.toFixed(1)} days`,
              icon: Clock,
              gradient: "from-blue-500 to-cyan-500",
              bgGradient: "from-blue-500/10 to-cyan-500/10",
            },
            {
              title: "Wishlist",
              value: <Heart className="h-8 w-8 fill-current" />,
              icon: Heart,
              gradient: "from-rose-500 to-pink-500",
              bgGradient: "from-rose-500/10 to-pink-500/10",
              href: "/wishlist",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              {stat.href ? (
                <Link to={stat.href}>
                  <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${stat.bgGradient} hover:shadow-xl transition-all duration-500 cursor-pointer h-full`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 hover:opacity-5 transition-opacity`} />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <stat.icon className={`h-4 w-4 bg-gradient-to-br ${stat.gradient} bg-clip-text`} style={{ color: 'currentColor' }} />
                        {stat.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                        {stat.value}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ) : (
                <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${stat.bgGradient} hover:shadow-xl transition-all duration-500 h-full`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 hover:opacity-5 transition-opacity`} />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <stat.icon className={`h-4 w-4`} />
                      {stat.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                      {stat.value}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Main Content Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 backdrop-blur-sm border border-border/50 p-1 h-auto flex-wrap">
            {[
              { value: 'overview', icon: MapPin, label: 'Overview' },
              { value: 'bookings', icon: Calendar, label: 'Bookings' },
              { value: 'rewards', icon: Gift, label: 'Rewards' },
              { value: 'reviews', icon: Star, label: 'Reviews' },
              { value: 'referrals', icon: Users, label: 'Referrals' },
              { value: 'profile', icon: User, label: 'Profile' },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <LoyaltyPoints points={loyaltyData.points} tier={loyaltyData.tier} />
              <ReferralSystem />
            </div>

            <Card className="border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/30 bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Recent Bookings</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('bookings')} className="gap-1">
                  View All <ArrowUpRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {bookings.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-4">
                      <MapPin className="h-10 w-10 text-primary/50" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                    <p className="text-muted-foreground mb-6">Start planning your next adventure!</p>
                    <Link to="/">
                      <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25">
                        <Sparkles className="h-4 w-4" />
                        Explore Destinations
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {bookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="p-4">
                        <BookingManagementCard 
                          booking={booking} 
                          onUpdate={fetchUserData}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card className="border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg overflow-hidden">
              <CardHeader className="border-b border-border/30 bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">All Bookings</CardTitle>
                    <p className="text-sm text-muted-foreground">{bookings.length} total bookings</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {bookings.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-4">
                      <MapPin className="h-10 w-10 text-primary/50" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                    <p className="text-muted-foreground mb-6">Start planning your next adventure!</p>
                    <Link to="/">
                      <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25">
                        <Sparkles className="h-4 w-4" />
                        Explore Destinations
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <BookingManagementCard 
                          booking={booking} 
                          onUpdate={fetchUserData}
                        />
                      </div>
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
      </motion.div>
    </motion.div>
  );
};

export default UserDashboard;
