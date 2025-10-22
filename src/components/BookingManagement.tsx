import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Lock, 
  Clock, 
  Users, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Star,
  CreditCard,
  Timer
} from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useBookingManagement } from '@/hooks/useBookingManagement';
import CalendarAvailabilityView from '@/components/CalendarAvailabilityView';
import BookingConfirmation from '@/components/BookingConfirmation';
import { BookingLockType, CalendarAvailability } from '@/lib/booking-lock-service';

interface BookingManagementProps {
  itemType: BookingLockType;
  itemId: string;
  itemName: string;
  itemDetails: any;
  className?: string;
}

const BookingManagement: React.FC<BookingManagementProps> = ({
  itemType,
  itemId,
  itemName,
  itemDetails,
  className = ''
}) => {
  const { user } = useAuth();
  const {
    locks,
    availability,
    pricing,
    loading,
    error,
    activeLocks,
    totalLockedValue,
    lockItem,
    extendLock,
    releaseLock,
    confirmBooking,
    getAvailability,
    getPricing,
    refreshLocks,
    canExtendLock,
    getTimeRemaining
  } = useBookingManagement(user?.id);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedAvailability, setSelectedAvailability] = useState<CalendarAvailability | null>(null);
  const [showBookingConfirmation, setShowBookingConfirmation] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'locks' | 'pricing'>('calendar');
  const [dateRange, setDateRange] = useState({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(addDays(new Date(), 30), 'yyyy-MM-dd')
  });

  // Load availability on mount
  useEffect(() => {
    if (itemType && itemId) {
      loadAvailability();
    }
  }, [itemType, itemId, dateRange]);

  const loadAvailability = async () => {
    await getAvailability(itemType, itemId, dateRange.start, dateRange.end);
  };

  const handleDateSelect = (date: string, availability: CalendarAvailability) => {
    setSelectedDate(date);
    setSelectedAvailability(availability);
    setShowBookingConfirmation(true);
    setActiveTab('calendar');
  };

  const handleBookingComplete = (bookingId: string) => {
    setShowBookingConfirmation(false);
    setSelectedDate('');
    setSelectedAvailability(null);
    toast.success(`Booking confirmed! Reference: ${bookingId}`);
    loadAvailability();
  };

  const handleBookingCancel = () => {
    setShowBookingConfirmation(false);
    setSelectedDate('');
    setSelectedAvailability(null);
  };

  const handleExtendLock = async (lockId: string) => {
    const success = await extendLock(lockId);
    if (success) {
      toast.success('Lock extended successfully');
    }
  };

  const handleReleaseLock = async (lockId: string) => {
    const success = await releaseLock(lockId);
    if (success) {
      toast.success('Lock released successfully');
    }
  };

  const handleConfirmBooking = async (lockId: string, paymentData: any) => {
    const bookingId = await confirmBooking(lockId, paymentData);
    if (bookingId) {
      handleBookingComplete(bookingId);
    }
  };

  // Get current user's lock for this item
  const currentLock = activeLocks.find(lock => 
    lock.itemType === itemType && lock.itemId === itemId
  );

  // Calculate pricing trend
  const pricingTrend = availability.length > 1 ? (
    availability[availability.length - 1].price > availability[0].price ? 'up' : 'down'
  ) : 'stable';

  if (showBookingConfirmation && selectedDate && selectedAvailability) {
    return (
      <BookingConfirmation
        itemType={itemType}
        itemId={itemId}
        itemName={itemName}
        selectedDate={selectedDate}
        onBookingComplete={handleBookingComplete}
        onCancel={handleBookingCancel}
        className={className}
      />
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Calendar className="w-6 h-6 mr-2 text-blue-600" />
                  Booking Management
                </CardTitle>
                <CardDescription>{itemName}</CardDescription>
              </div>
              
              <div className="flex items-center space-x-2">
                {currentLock && (
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    <Lock className="w-3 h-3 mr-1" />
                    Locked ({getTimeRemaining(currentLock.id)}m left)
                  </Badge>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAvailability}
                  disabled={loading}
                >
                  <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Current Lock Status */}
        {currentLock && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Item Locked:</strong> You have this item locked for {getTimeRemaining(currentLock.id)} minutes.
                  Complete your booking to secure it.
                </div>
                <div className="flex items-center space-x-2">
                  {canExtendLock(currentLock.id) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExtendLock(currentLock.id)}
                    >
                      <Timer className="w-3 h-3 mr-1" />
                      Extend
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReleaseLock(currentLock.id)}
                  >
                    Release
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar">Availability</TabsTrigger>
            <TabsTrigger value="locks">Active Locks</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-6">
            <CalendarAvailabilityView
              itemType={itemType}
              itemId={itemId}
              itemName={itemName}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
            />
          </TabsContent>

          <TabsContent value="locks" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Active Locks</h3>
                <Badge variant="outline">
                  {activeLocks.length} Active
                </Badge>
              </div>

              {activeLocks.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Lock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Locks</h4>
                    <p className="text-gray-600">You don't have any active booking locks at the moment.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {activeLocks.map((lock) => (
                    <Card key={lock.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline" className="text-blue-600">
                                {lock.itemType.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <Badge variant="outline">
                                {getTimeRemaining(lock.id)}m left
                              </Badge>
                            </div>
                            
                            <h4 className="font-medium text-gray-900 mb-1">
                              {lock.itemDetails?.name || 'Unknown Item'}
                            </h4>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span>{format(new Date(lock.lockedAt), 'MMM dd, yyyy')}</span>
                              </div>
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-2" />
                                <span>₹{lock.pricing.total}</span>
                              </div>
                            </div>
                            
                            {lock.extensions > 0 && (
                              <p className="text-xs text-gray-500 mt-2">
                                Extended {lock.extensions} time(s)
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {canExtendLock(lock.id) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExtendLock(lock.id)}
                              >
                                <Timer className="w-3 h-3 mr-1" />
                                Extend
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReleaseLock(lock.id)}
                            >
                              Release
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-900">Total Locked Value</h4>
                      <p className="text-sm text-blue-800">Amount locked across all items</p>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      ₹{totalLockedValue}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Dynamic Pricing</h3>
                <div className="flex items-center space-x-1">
                  {pricingTrend === 'up' && <TrendingUp className="w-4 h-4 text-red-600" />}
                  {pricingTrend === 'down' && <TrendingDown className="w-4 h-4 text-green-600" />}
                  <Badge variant="outline">
                    {pricingTrend === 'up' ? 'Rising' : pricingTrend === 'down' ? 'Falling' : 'Stable'}
                  </Badge>
                </div>
              </div>

              {availability.length > 0 ? (
                <div className="grid gap-4">
                  {availability.slice(0, 7).map((day) => (
                    <Card key={day.date} className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">
                              {format(new Date(day.date), 'MMM dd, yyyy')}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {day.inventory - day.locked} available
                              </span>
                              <span className="flex items-center">
                                <Lock className="w-3 h-3 mr-1" />
                                {day.locked} locked
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">₹{day.price}</div>
                            <Badge variant={day.available ? "default" : "destructive"}>
                              {day.available ? "Available" : "Unavailable"}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <DollarSign className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Pricing Data</h4>
                    <p className="text-gray-600">Pricing information will appear when you select dates.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Error Display */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default BookingManagement;
