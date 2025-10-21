// src/components/dashboard/AdminDashboard.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Area,
  AreaChart
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
  Camera,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
      
      // Fetch bookings data
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .gte('created_at', new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString());

      if (bookingsError) throw bookingsError;

      // Fetch users data
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*');

      if (usersError) throw usersError;

      // Calculate stats
      const totalBookings = bookings?.length || 0;
      const totalRevenue = bookings?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;
      const totalUsers = users?.length || 0;
      const confirmedBookings = bookings?.filter(b => b.status === 'confirmed').length || 0;
      const conversionRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0;
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Mock growth data (in real app, compare with previous period)
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

      // Calculate booking analytics
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

      // Calculate user analytics
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
      return { date: new Date(date).toLocaleDateString(), registrations };
    });
  };

  const calculateUserActivity = (users: any[]) => {
    // Mock data for user activity
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        date: date.toLocaleDateString(),
        activeUsers: Math.floor(Math.random() * 50) + 20,
        sessions: Math.floor(Math.random() * 100) + 50,
      };
    }).reverse();
    return last7Days;
  };

  const calculateUserSegments = (users: any[]) => {
    // Mock user segments
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor your travel platform performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setRefreshKey(prev => prev + 1)} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{stats.monthlyGrowth}%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{stats.revenueGrowth}%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12.5%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+2.1%</span> from last month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookings">Bookings Analytics</TabsTrigger>
          <TabsTrigger value="users">User Analytics</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          {bookingAnalytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Bookings by Month */}
              <Card>
                <CardHeader>
                  <CardTitle>Bookings by Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={bookingAnalytics.bookingsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="bookings" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Bookings by Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Bookings by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={bookingAnalytics.bookingsByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, percentage }) => `${type} ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {bookingAnalytics.bookingsByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Destinations */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Destinations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {bookingAnalytics.topDestinations.map((dest, index) => (
                      <div key={dest.destination} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span>{dest.destination}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{dest.bookings} bookings</div>
                          <div className="text-sm text-muted-foreground">₹{dest.revenue.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Booking Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {bookingAnalytics.bookingStatus.map((status) => (
                      <div key={status.status} className="flex items-center justify-between">
                        <span>{status.status}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${status.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{status.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {userAnalytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* User Registrations */}
              <Card>
                <CardHeader>
                  <CardTitle>User Registrations (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={userAnalytics.userRegistrations}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="registrations" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* User Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>User Activity (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={userAnalytics.userActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="activeUsers" stroke="#8884d8" />
                      <Line type="monotone" dataKey="sessions" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* User Segments */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>User Segments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {userAnalytics.userSegments.map((segment, index) => (
                      <div key={segment.segment} className="text-center">
                        <div className="text-2xl font-bold">{segment.count}</div>
                        <div className="text-sm text-muted-foreground">{segment.segment}</div>
                        <div className="text-xs text-muted-foreground">{segment.percentage}%</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          {bookingAnalytics && (
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Month</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={bookingAnalytics.bookingsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
