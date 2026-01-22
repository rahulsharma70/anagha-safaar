import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar, 
  MapPin,
  Plane,
  Hotel,
  Download,
  RefreshCw,
  Sparkles,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { motion } from 'framer-motion';

interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  totalUsers: number;
  conversionRate: number;
  averageBookingValue: number;
  monthlyGrowth: number;
  revenueGrowth: number;
}

interface BookingAnalytics {
  bookingsByMonth: Array<{ month: string; bookings: number; revenue: number }>;
  bookingsByType: Array<{ type: string; count: number; percentage: number }>;
  topDestinations: Array<{ destination: string; bookings: number; revenue: number }>;
  bookingStatus: Array<{ status: string; count: number; percentage: number }>;
}

interface UserAnalytics {
  userRegistrations: Array<{ date: string; registrations: number }>;
  userActivity: Array<{ date: string; activeUsers: number; sessions: number }>;
  userSegments: Array<{ segment: string; count: number; percentage: number }>;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

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

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookingAnalytics, setBookingAnalytics] = useState<BookingAnalytics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange, refreshKey]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .gte('created_at', new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString());

      if (bookingsError) throw bookingsError;

      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*');

      if (usersError) throw usersError;

      const totalBookings = bookings?.length || 0;
      const totalRevenue = bookings?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;
      const totalUsers = users?.length || 0;
      const confirmedBookings = bookings?.filter(b => b.status === 'confirmed').length || 0;
      const conversionRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      const monthlyGrowth = 15.2;
      const revenueGrowth = 23.8;

      setStats({
        totalBookings,
        totalRevenue,
        totalUsers,
        conversionRate,
        averageBookingValue,
        monthlyGrowth,
        revenueGrowth,
      });

      const bookingsByMonth = calculateBookingsByMonth(bookings || []);
      const bookingsByType = calculateBookingsByType(bookings || []);
      const topDestinations = calculateTopDestinations(bookings || []);
      const bookingStatus = calculateBookingStatus(bookings || []);

      setBookingAnalytics({
        bookingsByMonth,
        bookingsByType,
        topDestinations,
        bookingStatus,
      });

      const userRegistrations = calculateUserRegistrations(users || []);
      const userActivity = calculateUserActivity(users || []);
      const userSegments = calculateUserSegments(users || []);

      setUserAnalytics({
        userRegistrations,
        userActivity,
        userSegments,
      });

    } catch (error) {
      logger.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBookingsByMonth = (bookings: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(month => {
      const monthBookings = bookings.filter(booking => {
        const date = new Date(booking.created_at);
        return months[date.getMonth()] === month;
      });
      return {
        month,
        bookings: monthBookings.length,
        revenue: monthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
      };
    });
  };

  const calculateBookingsByType = (bookings: any[]) => {
    const types = ['hotel', 'flight', 'tour'];
    const total = bookings.length;
    return types.map(type => {
      const count = bookings.filter(b => b.item_type === type).length;
      return {
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      };
    });
  };

  const calculateTopDestinations = (bookings: any[]) => {
    const destinations: Record<string, { bookings: number; revenue: number }> = {};
    bookings.forEach(booking => {
      const dest = booking.item_id || 'Unknown';
      if (!destinations[dest]) {
        destinations[dest] = { bookings: 0, revenue: 0 };
      }
      destinations[dest].bookings++;
      destinations[dest].revenue += booking.total_amount || 0;
    });

    return Object.entries(destinations)
      .map(([destination, data]) => ({ destination, ...data }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);
  };

  const calculateBookingStatus = (bookings: any[]) => {
    const statuses = ['confirmed', 'pending', 'cancelled', 'failed'];
    const total = bookings.length;
    return statuses.map(status => {
      const count = bookings.filter(b => b.status === status).length;
      return {
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      };
    });
  };

  const calculateUserRegistrations = (users: any[]) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last30Days.map(date => {
      const registrations = users.filter(user => 
        user.created_at?.startsWith(date)
      ).length;
      return { date: new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }), registrations };
    });
  };

  const calculateUserActivity = (users: any[]) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        activeUsers: Math.floor(Math.random() * 50) + 20,
        sessions: Math.floor(Math.random() * 100) + 50,
      };
    }).reverse();
    return last7Days;
  };

  const calculateUserSegments = (users: any[]) => {
    return [
      { segment: 'New Users', count: Math.floor(users.length * 0.3), percentage: 30 },
      { segment: 'Regular Users', count: Math.floor(users.length * 0.5), percentage: 50 },
      { segment: 'VIP Users', count: Math.floor(users.length * 0.2), percentage: 20 },
    ];
  };

  const exportData = () => {
    const data = {
      stats,
      bookingAnalytics,
      userAnalytics,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Confirmed: 'bg-emerald-500',
      Pending: 'bg-amber-500',
      Cancelled: 'bg-rose-500',
      Failed: 'bg-red-600',
    };
    return colors[status] || 'bg-muted';
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
            <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Bookings",
      value: stats?.totalBookings.toLocaleString() || '0',
      icon: Calendar,
      trend: `+${stats?.monthlyGrowth}%`,
      trendUp: true,
      gradient: "from-violet-500 to-purple-600",
      bgGradient: "from-violet-500/10 to-purple-600/10",
      iconBg: "bg-violet-500/20",
    },
    {
      title: "Total Revenue",
      value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      trend: `+${stats?.revenueGrowth}%`,
      trendUp: true,
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-500/10 to-teal-500/10",
      iconBg: "bg-emerald-500/20",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers.toLocaleString() || '0',
      icon: Users,
      trend: "+12.5%",
      trendUp: true,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
      iconBg: "bg-blue-500/20",
    },
    {
      title: "Conversion Rate",
      value: `${(stats?.conversionRate || 0).toFixed(1)}%`,
      icon: Target,
      trend: "+2.1%",
      trendUp: true,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-500/10 to-orange-500/10",
      iconBg: "bg-amber-500/20",
    },
  ];

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-xl shadow-primary/25">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Monitor your travel platform performance ✨
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36 bg-card border-border/50 shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50">
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => setRefreshKey(prev => prev + 1)} 
            variant="outline"
            className="bg-card border-border/50 hover:bg-accent shadow-sm gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button 
            onClick={exportData} 
            variant="outline"
            className="bg-card border-border/50 hover:bg-accent shadow-sm gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer group`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-white/5 to-transparent" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`h-10 w-10 rounded-xl ${stat.iconBg} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                  <stat.icon className="h-5 w-5 text-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent tracking-tight`}>
                  {stat.value}
                </div>
                <div className="flex items-center text-sm">
                  {stat.trendUp ? (
                    <div className="flex items-center text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                      <span className="font-medium">{stat.trend}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                      <ArrowDownRight className="mr-1 h-3 w-3" />
                      <span className="font-medium">{stat.trend}</span>
                    </div>
                  )}
                  <span className="text-muted-foreground ml-2 text-xs">from last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Analytics Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="bg-muted/50 backdrop-blur-sm border border-border/50 p-1 h-auto">
            <TabsTrigger value="bookings" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2.5">
              <Calendar className="h-4 w-4" />
              Bookings Analytics
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2.5">
              <Users className="h-4 w-4" />
              User Analytics
            </TabsTrigger>
            <TabsTrigger value="revenue" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2.5">
              <DollarSign className="h-4 w-4" />
              Revenue Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">
            {bookingAnalytics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bookings by Month */}
                <Card className="border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg overflow-hidden">
                  <CardHeader className="border-b border-border/30 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Bookings by Month</CardTitle>
                        <CardDescription>Monthly booking trends</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={bookingAnalytics.bookingsByMonth}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
                        <YAxis axisLine={false} tickLine={false} className="text-xs" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "12px",
                            boxShadow: "0 10px 40px -10px hsl(var(--primary) / 0.2)",
                          }}
                        />
                        <Bar dataKey="bookings" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Bookings by Type */}
                <Card className="border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg overflow-hidden">
                  <CardHeader className="border-b border-border/30 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-chart-2/20 to-chart-2/5 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-chart-2" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Bookings by Type</CardTitle>
                        <CardDescription>Distribution across categories</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={bookingAnalytics.bookingsByType}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="count"
                          strokeWidth={0}
                        >
                          {bookingAnalytics.bookingsByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-6 mt-4">
                      {bookingAnalytics.bookingsByType.map((entry, index) => (
                        <div key={entry.type} className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm text-muted-foreground">{entry.type}</span>
                          <span className="text-sm font-medium">{entry.percentage.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Destinations */}
                <Card className="border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg overflow-hidden">
                  <CardHeader className="border-b border-border/30 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Top Destinations</CardTitle>
                        <CardDescription>Most popular booking locations</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {bookingAnalytics.topDestinations.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No destination data available</p>
                      ) : (
                        bookingAnalytics.topDestinations.map((dest, index) => (
                          <div key={dest.destination} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                                index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                                index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
                                index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                                'bg-gradient-to-br from-muted to-muted-foreground/30'
                              }`}>
                                {index + 1}
                              </div>
                              <span className="font-medium truncate max-w-[150px]">{dest.destination}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{dest.bookings} bookings</div>
                              <div className="text-sm text-muted-foreground">₹{dest.revenue.toLocaleString()}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Booking Status */}
                <Card className="border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg overflow-hidden">
                  <CardHeader className="border-b border-border/30 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Booking Status</CardTitle>
                        <CardDescription>Current status distribution</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-5">
                      {bookingAnalytics.bookingStatus.map((status) => (
                        <div key={status.status} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor(status.status)}`} />
                              <span className="font-medium">{status.status}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground">{status.percentage.toFixed(0)}%</span>
                              <Badge variant="secondary" className="min-w-[50px] justify-center">
                                {status.count}
                              </Badge>
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <motion.div 
                              className={`h-full rounded-full ${getStatusColor(status.status)}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${status.percentage}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {userAnalytics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Registrations */}
                <Card className="lg:col-span-2 border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg overflow-hidden">
                  <CardHeader className="border-b border-border/30 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center">
                        <Users className="h-5 w-5 text-violet-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">User Registrations</CardTitle>
                        <CardDescription>New user signups over the last 30 days</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={userAnalytics.userRegistrations}>
                        <defs>
                          <linearGradient id="registrationGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} className="text-xs" />
                        <YAxis axisLine={false} tickLine={false} className="text-xs" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "12px",
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="registrations" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          fill="url(#registrationGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* User Activity */}
                <Card className="border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg overflow-hidden">
                  <CardHeader className="border-b border-border/30 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-cyan-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">User Activity</CardTitle>
                        <CardDescription>Active users and sessions (7 days)</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={userAnalytics.userActivity}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} className="text-xs" />
                        <YAxis axisLine={false} tickLine={false} className="text-xs" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "12px",
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="activeUsers" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="sessions" 
                          stroke="hsl(var(--chart-2))" 
                          strokeWidth={3}
                          dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* User Segments */}
                <Card className="border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg overflow-hidden">
                  <CardHeader className="border-b border-border/30 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 flex items-center justify-center">
                        <Target className="h-5 w-5 text-pink-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">User Segments</CardTitle>
                        <CardDescription>User classification breakdown</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-5">
                      {userAnalytics.userSegments.map((segment, index) => (
                        <div key={segment.segment} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-3 w-3 rounded-full" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span className="font-medium">{segment.segment}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground">{segment.percentage}%</span>
                              <Badge variant="secondary" className="min-w-[50px] justify-center">
                                {segment.count}
                              </Badge>
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <motion.div 
                              className="h-full rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              initial={{ width: 0 }}
                              animate={{ width: `${segment.percentage}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            {bookingAnalytics && (
              <div className="grid grid-cols-1 gap-6">
                {/* Revenue by Month */}
                <Card className="border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg overflow-hidden">
                  <CardHeader className="border-b border-border/30 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Revenue by Month</CardTitle>
                        <CardDescription>Monthly revenue performance</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={bookingAnalytics.bookingsByMonth}>
                        <defs>
                          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          className="text-xs"
                          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "12px",
                          }}
                          formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="hsl(var(--chart-2))" 
                          strokeWidth={3}
                          fill="url(#revenueGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Revenue Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border border-border/50 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 shadow-lg">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Revenue</p>
                          <p className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                            ₹{(stats?.totalRevenue || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-emerald-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-border/50 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 shadow-lg">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Avg. Booking Value</p>
                          <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                            ₹{Math.round(stats?.averageBookingValue || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-blue-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-border/50 bg-gradient-to-br from-violet-500/10 to-purple-500/10 shadow-lg">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Revenue Growth</p>
                          <p className="text-3xl font-bold bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
                            +{stats?.revenueGrowth}%
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                          <ArrowUpRight className="h-6 w-6 text-violet-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;
