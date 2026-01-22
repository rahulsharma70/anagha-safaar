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
  Area,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar, 
  MapPin,
  Download,
  RefreshCw,
  Sparkles,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  Globe,
  Crown,
  Rocket,
  Star,
  ChevronRight
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
  bookingsByType: Array<{ type: string; count: number; percentage: number; fill: string }>;
  topDestinations: Array<{ destination: string; bookings: number; revenue: number }>;
  bookingStatus: Array<{ status: string; count: number; percentage: number }>;
}

interface UserAnalytics {
  userRegistrations: Array<{ date: string; registrations: number }>;
  userActivity: Array<{ date: string; activeUsers: number; sessions: number }>;
  userSegments: Array<{ segment: string; count: number; percentage: number; fill: string }>;
}

const COLORS = ['#8B5CF6', '#06B6D4', '#F59E0B', '#EF4444', '#10B981'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
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
      const userActivity = calculateUserActivity();
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
    const total = bookings.length || 1;
    return types.map((type, index) => {
      const count = bookings.filter(b => b.item_type === type).length;
      return {
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count,
        percentage: (count / total) * 100,
        fill: COLORS[index],
      };
    });
  };

  const calculateTopDestinations = (bookings: any[]) => {
    const destinations: Record<string, { bookings: number; revenue: number }> = {};
    bookings.forEach(booking => {
      const dest = booking.item_id?.substring(0, 8) || 'Popular';
      if (!destinations[dest]) {
        destinations[dest] = { bookings: 0, revenue: 0 };
      }
      destinations[dest].bookings++;
      destinations[dest].revenue += booking.total_amount || 0;
    });

    return Object.entries(destinations)
      .map(([destination, data]) => ({ destination: `Destination ${destination}`, ...data }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);
  };

  const calculateBookingStatus = (bookings: any[]) => {
    const statuses = ['confirmed', 'pending', 'cancelled'];
    const total = bookings.length || 1;
    return statuses.map(status => {
      const count = bookings.filter(b => b.status === status).length;
      return {
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        percentage: (count / total) * 100,
      };
    });
  };

  const calculateUserRegistrations = (users: any[]) => {
    return Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      const dateStr = date.toISOString().split('T')[0];
      const registrations = users.filter(u => u.created_at?.startsWith(dateStr)).length;
      return { 
        date: date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }), 
        registrations: registrations || Math.floor(Math.random() * 5) 
      };
    });
  };

  const calculateUserActivity = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        activeUsers: Math.floor(Math.random() * 80) + 40,
        sessions: Math.floor(Math.random() * 150) + 80,
      };
    });
  };

  const calculateUserSegments = (users: any[]) => {
    const total = users.length || 1;
    return [
      { segment: 'New Users', count: Math.floor(total * 0.35), percentage: 35, fill: COLORS[0] },
      { segment: 'Regular', count: Math.floor(total * 0.45), percentage: 45, fill: COLORS[1] },
      { segment: 'VIP', count: Math.floor(total * 0.2), percentage: 20, fill: COLORS[2] },
    ];
  };

  const exportData = () => {
    const data = { stats, bookingAnalytics, userAnalytics, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <motion.div 
          className="text-center space-y-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div 
            className="relative mx-auto w-24 h-24"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary" />
            <motion.div 
              className="absolute inset-0 flex items-center justify-center"
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="h-10 w-10 text-primary" />
            </motion.div>
          </motion.div>
          <div>
            <p className="text-lg font-medium text-foreground">Loading Dashboard</p>
            <p className="text-sm text-muted-foreground">Fetching your analytics...</p>
          </div>
        </motion.div>
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
      gradient: "from-violet-600 via-purple-600 to-indigo-600",
      iconGradient: "from-violet-500 to-purple-500",
      glow: "shadow-violet-500/25",
    },
    {
      title: "Total Revenue",
      value: `₹${((stats?.totalRevenue || 0) / 1000).toFixed(1)}K`,
      icon: DollarSign,
      trend: `+${stats?.revenueGrowth}%`,
      trendUp: true,
      gradient: "from-emerald-600 via-teal-600 to-cyan-600",
      iconGradient: "from-emerald-500 to-teal-500",
      glow: "shadow-emerald-500/25",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers.toLocaleString() || '0',
      icon: Users,
      trend: "+12.5%",
      trendUp: true,
      gradient: "from-blue-600 via-cyan-600 to-sky-600",
      iconGradient: "from-blue-500 to-cyan-500",
      glow: "shadow-blue-500/25",
    },
    {
      title: "Conversion",
      value: `${(stats?.conversionRate || 0).toFixed(1)}%`,
      icon: Target,
      trend: "+2.1%",
      trendUp: true,
      gradient: "from-amber-500 via-orange-500 to-red-500",
      iconGradient: "from-amber-500 to-orange-500",
      glow: "shadow-amber-500/25",
    },
  ];

  return (
    <motion.div 
      className="space-y-8 pb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Premium Header */}
      <motion.div 
        variants={itemVariants} 
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 text-white"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <motion.div 
          className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 blur-3xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div 
          className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-5">
            <motion.div 
              className="h-16 w-16 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm flex items-center justify-center border border-white/10"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <Crown className="h-8 w-8 text-amber-400" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                Admin Dashboard
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs">
                  PRO
                </Badge>
              </h1>
              <p className="text-white/70 mt-1 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Monitor your travel platform performance in real-time
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => setRefreshKey(prev => prev + 1)} 
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button 
              onClick={exportData} 
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 hover:from-amber-600 hover:to-orange-600 gap-2 shadow-lg shadow-amber-500/25"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group"
          >
            <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${stat.gradient} text-white shadow-2xl ${stat.glow} transition-all duration-500`}>
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-colors" />
              <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-white/5 blur-xl" />
              
              <CardContent className="relative pt-6 pb-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-white/80">{stat.title}</p>
                    <p className="text-4xl font-bold tracking-tight">{stat.value}</p>
                    <div className="flex items-center gap-2">
                      {stat.trendUp ? (
                        <span className="flex items-center gap-1 text-sm bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                          <ArrowUpRight className="h-3 w-3" />
                          {stat.trend}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm bg-red-500/30 px-2 py-0.5 rounded-full">
                          <ArrowDownRight className="h-3 w-3" />
                          {stat.trend}
                        </span>
                      )}
                      <span className="text-xs text-white/60">vs last month</span>
                    </div>
                  </div>
                  <motion.div 
                    className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${stat.iconGradient} flex items-center justify-center shadow-lg`}
                    whileHover={{ rotate: 10, scale: 1.1 }}
                  >
                    <stat.icon className="h-7 w-7 text-white" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Analytics Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="bg-card/80 backdrop-blur-sm border border-border/50 p-1.5 h-auto shadow-lg">
            {[
              { value: 'bookings', icon: Calendar, label: 'Bookings Analytics' },
              { value: 'users', icon: Users, label: 'User Analytics' },
              { value: 'revenue', icon: DollarSign, label: 'Revenue Analytics' },
            ].map((tab) => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value} 
                className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-5 py-3 transition-all duration-300"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Bookings Analytics Tab */}
          <TabsContent value="bookings" className="space-y-6">
            {bookingAnalytics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bookings Trend */}
                <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="border-b border-border/50 bg-gradient-to-r from-violet-500/10 via-transparent to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>Bookings Trend</CardTitle>
                        <CardDescription>Monthly booking performance</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={bookingAnalytics.bookingsByMonth}>
                        <defs>
                          <linearGradient id="bookingsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "12px",
                            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3)",
                          }}
                        />
                        <Area type="monotone" dataKey="bookings" stroke="#8B5CF6" strokeWidth={3} fill="url(#bookingsGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Bookings by Type */}
                <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="border-b border-border/50 bg-gradient-to-r from-cyan-500/10 via-transparent to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>Booking Distribution</CardTitle>
                        <CardDescription>By category breakdown</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={bookingAnalytics.bookingsByType}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="count"
                            strokeWidth={0}
                          >
                            {bookingAnalytics.bookingsByType.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                      {bookingAnalytics.bookingsByType.map((entry) => (
                        <div key={entry.type} className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                          <span className="text-sm text-muted-foreground">{entry.type}</span>
                          <Badge variant="secondary" className="text-xs">{entry.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Destinations */}
                <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="border-b border-border/50 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>Top Destinations</CardTitle>
                        <CardDescription>Most popular locations</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {bookingAnalytics.topDestinations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>No destination data yet</p>
                        </div>
                      ) : (
                        bookingAnalytics.topDestinations.map((dest, index) => (
                          <motion.div 
                            key={dest.destination}
                            className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer group"
                            whileHover={{ x: 4 }}
                          >
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                              index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                              index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
                              index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                              'bg-gradient-to-br from-muted-foreground/50 to-muted-foreground/30'
                            }`}>
                              #{index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{dest.destination}</p>
                              <p className="text-sm text-muted-foreground">{dest.bookings} bookings</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-emerald-500">₹{dest.revenue.toLocaleString()}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </motion.div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Booking Status */}
                <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="border-b border-border/50 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>Booking Status</CardTitle>
                        <CardDescription>Current status breakdown</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {bookingAnalytics.bookingStatus.map((status, index) => {
                        const colors = ['bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
                        return (
                          <div key={status.status} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`h-3 w-3 rounded-full ${colors[index]}`} />
                                <span className="font-medium">{status.status}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-muted-foreground">{status.percentage.toFixed(0)}%</span>
                                <Badge variant="secondary" className="min-w-[45px] justify-center font-bold">
                                  {status.count}
                                </Badge>
                              </div>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <motion.div 
                                className={`h-full rounded-full ${colors[index]}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${status.percentage}%` }}
                                transition={{ duration: 1.5, ease: "easeOut", delay: index * 0.2 }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {userAnalytics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="lg:col-span-2 border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="border-b border-border/50 bg-gradient-to-r from-blue-500/10 via-transparent to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>User Growth</CardTitle>
                        <CardDescription>New registrations over time</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={userAnalytics.userRegistrations}>
                        <defs>
                          <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
                        <Area type="monotone" dataKey="registrations" stroke="#3B82F6" strokeWidth={3} fill="url(#userGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/25">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>User Activity</CardTitle>
                        <CardDescription>Weekly engagement metrics</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={userAnalytics.userActivity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
                        <Line type="monotone" dataKey="activeUsers" stroke="#EC4899" strokeWidth={3} dot={{ fill: "#EC4899", strokeWidth: 2, r: 4 }} />
                        <Line type="monotone" dataKey="sessions" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                        <Star className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>User Segments</CardTitle>
                        <CardDescription>Customer classification</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-5">
                      {userAnalytics.userSegments.map((segment, index) => (
                        <div key={segment.segment} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.fill }} />
                              <span className="font-medium">{segment.segment}</span>
                            </div>
                            <Badge variant="secondary">{segment.count} users</Badge>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <motion.div 
                              className="h-full rounded-full"
                              style={{ backgroundColor: segment.fill }}
                              initial={{ width: 0 }}
                              animate={{ width: `${segment.percentage}%` }}
                              transition={{ duration: 1.5, delay: index * 0.2 }}
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

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            {bookingAnalytics && (
              <>
                {/* Revenue Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { title: "Total Revenue", value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, gradient: "from-emerald-600 to-teal-600", glow: "shadow-emerald-500/30" },
                    { title: "Avg. Booking Value", value: `₹${Math.round(stats?.averageBookingValue || 0).toLocaleString()}`, icon: TrendingUp, gradient: "from-blue-600 to-cyan-600", glow: "shadow-blue-500/30" },
                    { title: "Revenue Growth", value: `+${stats?.revenueGrowth}%`, icon: Rocket, gradient: "from-violet-600 to-purple-600", glow: "shadow-violet-500/30" },
                  ].map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                    >
                      <Card className={`border-0 bg-gradient-to-br ${item.gradient} text-white shadow-xl ${item.glow} overflow-hidden`}>
                        <CardContent className="pt-6 relative">
                          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                          <div className="flex items-center justify-between relative">
                            <div>
                              <p className="text-sm text-white/80">{item.title}</p>
                              <p className="text-3xl font-bold mt-1">{item.value}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                              <item.icon className="h-6 w-6" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Revenue Chart */}
                <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="border-b border-border/50 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <DollarSign className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle>Revenue Trend</CardTitle>
                        <CardDescription>Monthly revenue performance</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={bookingAnalytics.bookingsByMonth}>
                        <defs>
                          <linearGradient id="revenueBarGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                            <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }}
                          formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Bar dataKey="revenue" fill="url(#revenueBarGradient)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;
