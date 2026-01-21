import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  RefreshCw,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
  avgBookingValue: number;
  revenueByMonth: { month: string; revenue: number; bookings: number }[];
  bookingsByType: { name: string; value: number; color: string }[];
  topDestinations: { name: string; bookings: number; revenue: number }[];
  conversionRate: number;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(210, 70%, 50%)",
  "hsl(270, 70%, 50%)",
];

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const [
        { data: bookings },
        { count: usersCount },
      ] = await Promise.all([
        supabase
          .from("bookings")
          .select("*")
          .gte("created_at", startDate.toISOString()),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);

      const totalRevenue = bookings?.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;
      const totalBookings = bookings?.length || 0;
      const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Calculate revenue by month
      const revenueByMonth: Record<string, { revenue: number; bookings: number }> = {};
      bookings?.forEach((booking) => {
        const month = new Date(booking.created_at).toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        });
        if (!revenueByMonth[month]) {
          revenueByMonth[month] = { revenue: 0, bookings: 0 };
        }
        revenueByMonth[month].revenue += Number(booking.total_amount) || 0;
        revenueByMonth[month].bookings += 1;
      });

      const revenueByMonthArray = Object.entries(revenueByMonth).map(([month, data]) => ({
        month,
        ...data,
      }));

      // Bookings by type
      const typeCount = { hotel: 0, flight: 0, tour: 0 };
      bookings?.forEach((booking) => {
        if (typeCount[booking.item_type as keyof typeof typeCount] !== undefined) {
          typeCount[booking.item_type as keyof typeof typeCount]++;
        }
      });

      const bookingsByType = [
        { name: "Hotels", value: typeCount.hotel, color: COLORS[0] },
        { name: "Flights", value: typeCount.flight, color: COLORS[1] },
        { name: "Tours", value: typeCount.tour, color: COLORS[2] },
      ];

      // Mock top destinations (in production, join with hotels/tours tables)
      const topDestinations = [
        { name: "Mumbai", bookings: Math.floor(totalBookings * 0.25), revenue: totalRevenue * 0.25 },
        { name: "Delhi", bookings: Math.floor(totalBookings * 0.20), revenue: totalRevenue * 0.20 },
        { name: "Goa", bookings: Math.floor(totalBookings * 0.18), revenue: totalRevenue * 0.18 },
        { name: "Jaipur", bookings: Math.floor(totalBookings * 0.15), revenue: totalRevenue * 0.15 },
        { name: "Kerala", bookings: Math.floor(totalBookings * 0.12), revenue: totalRevenue * 0.12 },
      ];

      // Mock conversion rate
      const conversionRate = 3.5 + Math.random() * 2;

      setData({
        totalRevenue,
        totalBookings,
        totalUsers: usersCount || 0,
        avgBookingValue,
        revenueByMonth: revenueByMonthArray,
        bookingsByType,
        topDestinations,
        conversionRate,
      });
    } catch (error) {
      logger.error("Failed to fetch analytics", error as Error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const exportData = () => {
    if (!data) return;

    const exportContent = {
      generatedAt: new Date().toISOString(),
      dateRange: `Last ${dateRange} days`,
      summary: {
        totalRevenue: data.totalRevenue,
        totalBookings: data.totalBookings,
        totalUsers: data.totalUsers,
        avgBookingValue: data.avgBookingValue,
        conversionRate: data.conversionRate,
      },
      revenueByMonth: data.revenueByMonth,
      bookingsByType: data.bookingsByType,
      topDestinations: data.topDestinations,
    };

    const blob = new Blob([JSON.stringify(exportContent, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Analytics exported successfully");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(data?.totalRevenue || 0),
      icon: DollarSign,
      trend: "+18%",
      trendUp: true,
    },
    {
      title: "Total Bookings",
      value: data?.totalBookings || 0,
      icon: Calendar,
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Total Users",
      value: data?.totalUsers || 0,
      icon: Users,
      trend: "+25%",
      trendUp: true,
    },
    {
      title: "Avg. Booking Value",
      value: formatCurrency(data?.avgBookingValue || 0),
      icon: TrendingUp,
      trend: "+5%",
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Track platform performance and metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportData} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={fetchAnalytics} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
              <div className="flex items-center text-xs mt-1">
                {kpi.trendUp ? (
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                )}
                <span className={kpi.trendUp ? "text-green-500" : "text-red-500"}>{kpi.trend}</span>
                <span className="text-muted-foreground ml-1">vs last period</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue & Bookings Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Bookings Trend</CardTitle>
            <CardDescription>Monthly performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.revenueByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Booking Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Distribution</CardTitle>
            <CardDescription>By category type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.bookingsByType || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {data?.bookingsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Destinations */}
        <Card>
          <CardHeader>
            <CardTitle>Top Destinations</CardTitle>
            <CardDescription>By number of bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.topDestinations || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={80} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Destination */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Destination</CardTitle>
            <CardDescription>Top revenue-generating locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.topDestinations || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis
                    className="text-xs"
                    tickFormatter={(value) =>
                      new Intl.NumberFormat("en-IN", {
                        notation: "compact",
                        compactDisplay: "short",
                      }).format(value)
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Rate Card */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Metrics</CardTitle>
          <CardDescription>Platform performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {data?.conversionRate.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">
                {formatCurrency(data?.avgBookingValue || 0)}
              </div>
              <p className="text-sm text-muted-foreground">Avg. Order Value</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">
                {((data?.totalBookings || 0) / (data?.totalUsers || 1)).toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">Bookings per User</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
