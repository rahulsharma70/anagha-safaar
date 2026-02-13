import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Calendar,
  Search,
  Filter,
  Plane,
  Hotel,
  Camera,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCcw,
  ArrowRight,
  History,
  Edit,
  Sparkles,
  TrendingDown,
  CalendarDays,
  Users,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, isPast, isFuture, isToday, differenceInDays } from 'date-fns';
import { BookingManagementCard } from '@/components/booking/BookingManagementCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Booking {
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
  guest_details?: any;
}

interface BookingHistoryEntry {
  id: string;
  booking_id: string;
  action: string;
  old_status: string | null;
  new_status: string | null;
  notes: string | null;
  created_at: string;
}

interface ModifyState {
  bookingId: string;
  newDate: Date | undefined;
  newEndDate: Date | undefined;
  newGuests: number;
}

const TripManagement = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingHistory, setBookingHistory] = useState<Record<string, BookingHistoryEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const [modifyDialog, setModifyDialog] = useState(false);
  const [modifyState, setModifyState] = useState<ModifyState | null>(null);
  const [modifying, setModifying] = useState(false);
  const [historyDialog, setHistoryDialog] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user?.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setBookings((data || []) as Booking[]);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingHistory = async (bookingId: string) => {
    if (bookingHistory[bookingId]) {
      setHistoryDialog(bookingId);
      return;
    }
    const { data, error } = await (supabase as any)
      .from('booking_history')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBookingHistory((prev) => ({ ...prev, [bookingId]: data }));
    }
    setHistoryDialog(bookingId);
  };

  const handleModifyBooking = async () => {
    if (!modifyState) return;
    setModifying(true);
    try {
      const updates: any = {};
      if (modifyState.newDate) updates.start_date = format(modifyState.newDate, 'yyyy-MM-dd');
      if (modifyState.newEndDate) updates.end_date = format(modifyState.newEndDate, 'yyyy-MM-dd');
      if (modifyState.newGuests > 0) updates.guests_count = modifyState.newGuests;

      const { error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', modifyState.bookingId);

      if (error) throw error;

      await (supabase as any).from('booking_history').insert({
        booking_id: modifyState.bookingId,
        action: 'modified',
        notes: `Booking modified: ${Object.keys(updates).join(', ')} updated`,
      });

      toast.success('Booking updated successfully');
      setModifyDialog(false);
      setModifyState(null);
      fetchBookings();
    } catch (error) {
      toast.error('Failed to modify booking');
    } finally {
      setModifying(false);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !b.booking_reference.toLowerCase().includes(q) &&
          !b.item_type.toLowerCase().includes(q)
        )
          return false;
      }
      // Type filter
      if (typeFilter !== 'all' && b.item_type !== typeFilter) return false;
      // Tab filter
      const startDate = new Date(b.start_date);
      switch (activeFilter) {
        case 'upcoming':
          return (isFuture(startDate) || isToday(startDate)) && b.status !== 'cancelled';
        case 'past':
          return isPast(startDate) && !isToday(startDate) && b.status !== 'cancelled';
        case 'cancelled':
          return b.status === 'cancelled';
        case 'refunds':
          return b.refund_status && b.refund_status !== 'none';
        default:
          return true;
      }
    });
  }, [bookings, searchQuery, typeFilter, activeFilter]);

  const counts = useMemo(() => {
    const upcoming = bookings.filter(
      (b) => (isFuture(new Date(b.start_date)) || isToday(new Date(b.start_date))) && b.status !== 'cancelled'
    ).length;
    const past = bookings.filter(
      (b) => isPast(new Date(b.start_date)) && !isToday(new Date(b.start_date)) && b.status !== 'cancelled'
    ).length;
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
    const refunds = bookings.filter((b) => b.refund_status && b.refund_status !== 'none').length;
    return { upcoming, past, cancelled, refunds };
  }, [bookings]);

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="h-4 w-4" />;
      case 'hotel': return <Hotel className="h-4 w-4" />;
      case 'tour': return <Camera className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getRefundStatusInfo = (status: string) => {
    switch (status) {
      case 'pending': return { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Refund Pending' };
      case 'processed': return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Refund Processed' };
      case 'failed': return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Refund Failed' };
      default: return { icon: AlertCircle, color: 'text-muted-foreground', bg: 'bg-muted', label: status };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <RefreshCcw className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Trip Management</h2>
            <p className="text-sm text-muted-foreground">{bookings.length} total bookings</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Upcoming', count: counts.upcoming, icon: Calendar, gradient: 'from-blue-500/10 to-cyan-500/10', text: 'text-blue-600 dark:text-blue-400' },
          { label: 'Completed', count: counts.past, icon: CheckCircle, gradient: 'from-emerald-500/10 to-green-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Cancelled', count: counts.cancelled, icon: XCircle, gradient: 'from-red-500/10 to-rose-500/10', text: 'text-red-600 dark:text-red-400' },
          { label: 'Refunds', count: counts.refunds, icon: TrendingDown, gradient: 'from-purple-500/10 to-violet-500/10', text: 'text-purple-600 dark:text-purple-400' },
        ].map((item) => (
          <Card
            key={item.label}
            className={`border-0 bg-gradient-to-br ${item.gradient} cursor-pointer hover:shadow-md transition-all`}
            onClick={() => setActiveFilter(item.label.toLowerCase())}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <item.icon className={`h-5 w-5 ${item.text}`} />
              <div>
                <p className={`text-2xl font-bold ${item.text}`}>{item.count}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="hotel">Hotels</SelectItem>
                <SelectItem value="flight">Flights</SelectItem>
                <SelectItem value="tour">Tours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tab Filters */}
      <Tabs value={activeFilter} onValueChange={setActiveFilter}>
        <TabsList className="bg-muted/50 border border-border/50">
          <TabsTrigger value="upcoming" className="gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Upcoming ({counts.upcoming})
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-1.5">
            <CheckCircle className="h-3.5 w-3.5" /> Past ({counts.past})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="gap-1.5">
            <XCircle className="h-3.5 w-3.5" /> Cancelled ({counts.cancelled})
          </TabsTrigger>
          <TabsTrigger value="refunds" className="gap-1.5">
            <TrendingDown className="h-3.5 w-3.5" /> Refunds ({counts.refunds})
          </TabsTrigger>
        </TabsList>

        {/* Bookings List */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3 mt-4"
          >
            {filteredBookings.length === 0 ? (
              <Card className="border border-border/50">
                <CardContent className="text-center py-16">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">
                    {activeFilter === 'upcoming'
                      ? 'No upcoming trips'
                      : activeFilter === 'cancelled'
                      ? 'No cancelled bookings'
                      : activeFilter === 'refunds'
                      ? 'No refunds'
                      : 'No past trips'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {activeFilter === 'upcoming'
                      ? 'Plan your next adventure!'
                      : 'Nothing to show here.'}
                  </p>
                  {activeFilter === 'upcoming' && (
                    <Link to="/">
                      <Button className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        Explore Destinations
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredBookings.map((booking) => (
                <motion.div
                  key={booking.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative"
                >
                  <Card className="border border-border/50 hover:shadow-md transition-all">
                    <CardContent className="p-0">
                      {/* Upcoming countdown badge */}
                      {activeFilter === 'upcoming' && isFuture(new Date(booking.start_date)) && (
                        <div className="bg-gradient-to-r from-primary/10 to-accent/5 px-4 py-2 text-xs font-medium text-primary flex items-center gap-1.5 border-b border-border/30">
                          <Clock className="h-3.5 w-3.5" />
                          {differenceInDays(new Date(booking.start_date), new Date())} days until your trip
                        </div>
                      )}

                      {/* Refund tracker for refund tab */}
                      {activeFilter === 'refunds' && booking.refund_status && booking.refund_status !== 'none' && (
                        <div className="px-4 py-3 border-b border-border/30 bg-muted/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">Refund Progress</span>
                            <Badge variant="outline" className={`text-xs ${getRefundStatusInfo(booking.refund_status).color}`}>
                              {getRefundStatusInfo(booking.refund_status).label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  booking.refund_status === 'processed'
                                    ? 'bg-green-500 w-full'
                                    : booking.refund_status === 'pending'
                                    ? 'bg-yellow-500 w-1/2'
                                    : 'bg-red-500 w-full'
                                }`}
                              />
                            </div>
                            <span className="text-sm font-semibold">
                              ₹{(booking.refund_amount || 0).toLocaleString()}
                            </span>
                          </div>
                          {/* Refund timeline steps */}
                          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              Requested
                            </div>
                            <ArrowRight className="h-3 w-3" />
                            <div className="flex items-center gap-1">
                              <div className={`h-2 w-2 rounded-full ${booking.refund_status === 'pending' ? 'bg-yellow-500 animate-pulse' : booking.refund_status === 'processed' ? 'bg-green-500' : 'bg-red-500'}`} />
                              Processing
                            </div>
                            <ArrowRight className="h-3 w-3" />
                            <div className="flex items-center gap-1">
                              <div className={`h-2 w-2 rounded-full ${booking.refund_status === 'processed' ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                              Completed
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="p-4">
                        <BookingManagementCard booking={booking} onUpdate={fetchBookings} />
                      </div>

                      {/* Action bar for upcoming bookings */}
                      {booking.status !== 'cancelled' && booking.status !== 'completed' && isFuture(new Date(booking.start_date)) && (
                        <div className="px-4 pb-3 flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={() => {
                              setModifyState({
                                bookingId: booking.id,
                                newDate: new Date(booking.start_date),
                                newEndDate: booking.end_date ? new Date(booking.end_date) : undefined,
                                newGuests: booking.guests_count,
                              });
                              setModifyDialog(true);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Modify Dates
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={() => fetchBookingHistory(booking.id)}
                          >
                            <History className="h-3.5 w-3.5" />
                            Activity Log
                          </Button>
                        </div>
                      )}

                      {/* Show history button for past/cancelled */}
                      {(booking.status === 'cancelled' || isPast(new Date(booking.start_date))) && (
                        <div className="px-4 pb-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={() => fetchBookingHistory(booking.id)}
                          >
                            <History className="h-3.5 w-3.5" />
                            View Activity Log
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </Tabs>

      {/* Modify Dialog */}
      <Dialog open={modifyDialog} onOpenChange={setModifyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modify Booking</DialogTitle>
            <DialogDescription>Update your trip dates or guest count.</DialogDescription>
          </DialogHeader>
          {modifyState && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Calendar className="h-4 w-4" />
                      {modifyState.newDate ? format(modifyState.newDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker
                      mode="single"
                      selected={modifyState.newDate}
                      onSelect={(date) => setModifyState((prev) => prev ? { ...prev, newDate: date } : null)}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Calendar className="h-4 w-4" />
                      {modifyState.newEndDate ? format(modifyState.newEndDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker
                      mode="single"
                      selected={modifyState.newEndDate}
                      onSelect={(date) => setModifyState((prev) => prev ? { ...prev, newEndDate: date } : null)}
                      disabled={(date) => date < (modifyState.newDate || new Date())}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Number of Guests</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setModifyState((prev) =>
                        prev ? { ...prev, newGuests: Math.max(1, prev.newGuests - 1) } : null
                      )
                    }
                  >
                    -
                  </Button>
                  <span className="text-lg font-semibold w-8 text-center">{modifyState.newGuests}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setModifyState((prev) =>
                        prev ? { ...prev, newGuests: prev.newGuests + 1 } : null
                      )
                    }
                  >
                    +
                  </Button>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> guests
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModifyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleModifyBooking} disabled={modifying}>
              {modifying ? (
                <>
                  <RefreshCcw className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking History Dialog */}
      <Dialog open={!!historyDialog} onOpenChange={() => setHistoryDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Activity Log
            </DialogTitle>
            <DialogDescription>Booking history and status changes</DialogDescription>
          </DialogHeader>
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {historyDialog && bookingHistory[historyDialog]?.length ? (
              bookingHistory[historyDialog].map((entry, idx) => (
                <div key={entry.id} className="flex gap-3 py-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full ${
                      entry.action === 'cancelled' ? 'bg-red-500' :
                      entry.action === 'modified' ? 'bg-blue-500' :
                      'bg-green-500'
                    }`} />
                    {idx < bookingHistory[historyDialog].length - 1 && (
                      <div className="w-px flex-1 bg-border mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="text-sm font-medium capitalize">{entry.action}</p>
                    {entry.old_status && entry.new_status && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Badge variant="outline" className="text-[10px] px-1 py-0">{entry.old_status}</Badge>
                        <ArrowRight className="h-3 w-3" />
                        <Badge variant="outline" className="text-[10px] px-1 py-0">{entry.new_status}</Badge>
                      </p>
                    )}
                    {entry.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(entry.created_at), 'PPp')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No activity recorded yet.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TripManagement;
