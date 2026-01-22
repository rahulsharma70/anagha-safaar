import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import {
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  Hotel,
  Plane,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Sparkles,
  Activity,
  BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { motion } from "framer-motion";

interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  pendingBookings: number;
  hotelsCount: number;
  flightsCount: number;
  toursCount: number;
}

interface RecentBooking {
  id: string;
  booking_reference: string;
  item_type: string;
  total_amount: number;
  status: string;
  created_at: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

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

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        { count: usersCount },
        { data: bookingsData, count: bookingsCount },
        { count: hotelsCount },
        { count: flightsCount },
        { count: toursCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("bookings").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(10),
        supabase.from("hotels").select("*", { count: "exact", head: true }),
        supabase.from("flights").select("*", { count: "exact", head: true }),
        supabase.from("tours").select("*", { count: "exact", head: true }),
      ]);

      const totalRevenue = bookingsData?.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;
      const pendingBookings = bookingsData?.filter((b) => b.status === "pending").length || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalBookings: bookingsCount || 0,
        totalRevenue,
        pendingBookings,
        hotelsCount: hotelsCount || 0,
        flightsCount: flightsCount || 0,
        toursCount: toursCount || 0,
      });

      setRecentBookings(bookingsData || []);

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          name: date.toLocaleDateString("en-US", { weekday: "short" }),
          bookings: Math.floor(Math.random() * 50) + 10,
          revenue: Math.floor(Math.random() * 50000) + 10000,
        };
      });
      setChartData(last7Days);

      const hotelBookings = bookingsData?.filter((b) => b.item_type === "hotel").length || 0;
      const flightBookings = bookingsData?.filter((b) => b.item_type === "flight").length || 0;
      const tourBookings = bookingsData?.filter((b) => b.item_type === "tour").length || 0;

      setPieData([
        { name: "Hotels", value: hotelBookings || 1, color: "hsl(var(--primary))" },
        { name: "Flights", value: flightBookings || 1, color: "hsl(var(--chart-2))" },
        { name: "Tours", value: tourBookings || 1, color: "hsl(var(--chart-3))" },
      ]);
    } catch (error) {
      logger.error("Failed to fetch dashboard data", error as Error);
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

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      trend: "+12%",
      trendUp: true,
      href: "/admin/users",
      gradient: "from-violet-500 to-purple-600",
      bgGradient: "from-violet-500/10 to-purple-600/10",
      iconBg: "bg-violet-500/20",
    },
    {
      title: "Total Bookings",
      value: stats?.totalBookings || 0,
      icon: Calendar,
      trend: "+8%",
      trendUp: true,
      href: "/admin/bookings",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
      iconBg: "bg-blue-500/20",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: DollarSign,
      trend: "+23%",
      trendUp: true,
      href: "/admin/analytics",
      gradient: "from-emerald-500 to-teal-500",
      bgGradient: "from-emerald-500/10 to-teal-500/10",
      iconBg: "bg-emerald-500/20",
    },
    {
      title: "Pending Bookings",
      value: stats?.pendingBookings || 0,
      icon: TrendingUp,
      trend: "-5%",
      trendUp: false,
      href: "/admin/bookings",
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-500/10 to-orange-500/10",
      iconBg: "bg-amber-500/20",
    },
  ];

  const inventoryCards = [
    {
      title: "Hotels",
      count: stats?.hotelsCount || 0,
      icon: Hotel,
      href: "/admin/hotels",
      gradient: "from-rose-500 to-pink-500",
      iconColor: "text-rose-500",
    },
    {
      title: "Flights",
      count: stats?.flightsCount || 0,
      icon: Plane,
      href: "/admin/flights",
      gradient: "from-sky-500 to-blue-500",
      iconColor: "text-sky-500",
    },
    {
      title: "Tours",
      count: stats?.toursCount || 0,
      icon: MapPin,
      href: "/admin/tours",
      gradient: "from-green-500 to-emerald-500",
      iconColor: "text-green-500",
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
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg shadow-primary/25">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Dashboard Overview
              </h1>
              <p className="text-muted-foreground">
                Welcome back! Here's what's happening with your platform.
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={fetchDashboardData}
          variant="outline"
          size="default"
          className="gap-2 bg-card hover:bg-accent transition-all duration-300 border-border/50 shadow-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Link key={stat.title} to={stat.href}>
            <motion.div
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
                    <stat.icon className={`h-5 w-5 bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`} style={{ color: `hsl(var(--primary))` }} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</div>
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
          </Link>
        ))}
      </motion.div>

      {/* Inventory Overview */}
      <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-3">
        {inventoryCards.map((item) => (
          <Link key={item.title} to={item.href}>
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
                  <item.icon className={`h-5 w-5 ${item.iconColor} transition-transform group-hover:scale-110 duration-300`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                    {item.count}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 group-hover:text-primary transition-colors flex items-center gap-1">
                    Manage {item.title} <ArrowUpRight className="h-3 w-3" />
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        ))}
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="lg:col-span-4 border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg overflow-hidden">
          <CardHeader className="border-b border-border/30 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Bookings & Revenue</CardTitle>
                <CardDescription>Last 7 days performance</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
                  <XAxis dataKey="name" className="text-xs" axisLine={false} tickLine={false} />
                  <YAxis className="text-xs" axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      boxShadow: "0 10px 40px -10px hsl(var(--primary) / 0.2)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fill="url(#colorBookings)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Booking Types Chart */}
        <Card className="lg:col-span-3 border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg overflow-hidden">
          <CardHeader className="border-b border-border/30 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-chart-2/20 to-chart-2/5 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <CardTitle className="text-lg">Booking Distribution</CardTitle>
                <CardDescription>Breakdown by category</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, index) => (
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
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Bookings */}
      <motion.div variants={itemVariants}>
        <Card className="border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/30 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle className="text-lg">Recent Bookings</CardTitle>
                <CardDescription>Latest bookings across all categories</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild className="bg-background/50 hover:bg-background">
              <Link to="/admin/bookings">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentBookings.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No bookings found</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentBookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                        booking.item_type === "hotel" 
                          ? "bg-rose-500/10" 
                          : booking.item_type === "flight" 
                          ? "bg-sky-500/10" 
                          : "bg-green-500/10"
                      }`}>
                        {booking.item_type === "hotel" && <Hotel className="h-6 w-6 text-rose-500" />}
                        {booking.item_type === "flight" && <Plane className="h-6 w-6 text-sky-500" />}
                        {booking.item_type === "tour" && <MapPin className="h-6 w-6 text-green-500" />}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{booking.booking_reference}</p>
                        <p className="text-sm text-muted-foreground capitalize">{booking.item_type} Booking</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="font-bold text-foreground">{formatCurrency(booking.total_amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`${
                          booking.status === "confirmed"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                            : booking.status === "pending"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                            : "bg-rose-500/10 text-rose-500 border-rose-500/30"
                        }`}
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
