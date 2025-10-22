import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  DollarSign, 
  Lock, 
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { format, addDays, subDays, isSameDay, isAfter, isBefore, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  bookingLockService, 
  BookingLockType, 
  CalendarAvailability,
  DynamicPricing 
} from '@/lib/booking-lock-service';

interface CalendarAvailabilityProps {
  itemType: BookingLockType;
  itemId: string;
  itemName: string;
  onDateSelect?: (date: string, availability: CalendarAvailability) => void;
  selectedDate?: string;
  className?: string;
}

interface PricingTooltipProps {
  pricing: DynamicPricing;
  availability: CalendarAvailability;
}

const PricingTooltip: React.FC<PricingTooltipProps> = ({ pricing, availability }) => (
  <div className="space-y-2 p-3">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">Base Price</span>
      <span className="text-sm">₹{pricing.basePrice}</span>
    </div>
    
    <div className="space-y-1 text-xs">
      <div className="flex items-center justify-between">
        <span className="flex items-center">
          <TrendingUp className="w-3 h-3 mr-1 text-green-600" />
          Demand
        </span>
        <span className="text-green-600">+{Math.round((pricing.factors.demand - 1) * 100)}%</span>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="flex items-center">
          <TrendingUp className="w-3 h-3 mr-1 text-blue-600" />
          Season
        </span>
        <span className="text-blue-600">+{Math.round((pricing.factors.season - 1) * 100)}%</span>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="flex items-center">
          <TrendingUp className="w-3 h-3 mr-1 text-purple-600" />
          Time
        </span>
        <span className="text-purple-600">+{Math.round((pricing.factors.timeOfDay - 1) * 100)}%</span>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="flex items-center">
          <TrendingDown className="w-3 h-3 mr-1 text-orange-600" />
          Advance Booking
        </span>
        <span className="text-orange-600">{Math.round((pricing.factors.advanceBooking - 1) * 100)}%</span>
      </div>
    </div>
    
    <div className="border-t pt-2">
      <div className="flex items-center justify-between font-semibold">
        <span>Final Price</span>
        <span className="text-lg">₹{pricing.finalPrice}</span>
      </div>
    </div>
    
    <div className="text-xs text-gray-600">
      <div className="flex items-center justify-between">
        <span>Available</span>
        <span>{availability.inventory - availability.locked}</span>
      </div>
      <div className="flex items-center justify-between">
        <span>Locked</span>
        <span>{availability.locked}</span>
      </div>
    </div>
  </div>
);

const CalendarAvailabilityView: React.FC<CalendarAvailabilityProps> = ({
  itemType,
  itemId,
  itemName,
  onDateSelect,
  selectedDate,
  className = ''
}) => {
  const [availability, setAvailability] = useState<CalendarAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ from: Date; to: Date } | undefined>();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [priceTrend, setPriceTrend] = useState<'up' | 'down' | 'stable'>('stable');

  // Calculate date range for current month view
  const dateRange = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    };
  }, [currentMonth]);

  // Load availability data
  const loadAvailability = async () => {
    try {
      setLoading(true);
      const data = await bookingLockService.getCalendarAvailability(
        itemType,
        itemId,
        dateRange.start,
        dateRange.end
      );
      
      setAvailability(data);
      
      // Calculate price trend
      if (data.length > 1) {
        const prices = data.map(d => d.price).filter(p => p > 0);
        if (prices.length > 1) {
          const firstPrice = prices[0];
          const lastPrice = prices[prices.length - 1];
          const change = (lastPrice - firstPrice) / firstPrice;
          
          if (change > 0.05) setPriceTrend('up');
          else if (change < -0.05) setPriceTrend('down');
          else setPriceTrend('stable');
        }
      }
      
    } catch (error) {
      console.error('Failed to load availability:', error);
      toast.error('Failed to load availability data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
  }, [itemType, itemId, dateRange.start, dateRange.end]);

  // Get availability for a specific date
  const getAvailabilityForDate = (date: Date): CalendarAvailability | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availability.find(a => a.date === dateStr) || null;
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    const availability = getAvailabilityForDate(date);
    if (availability && availability.available) {
      onDateSelect?.(format(date, 'yyyy-MM-dd'), availability);
    } else {
      toast.error('Selected date is not available');
    }
  };

  // Custom day renderer with availability indicators
  const renderDay = (date: Date) => {
    const availability = getAvailabilityForDate(date);
    const isSelected = selectedDate && isSameDay(date, new Date(selectedDate));
    const isToday = isSameDay(date, new Date());
    const isPast = isBefore(date, new Date());
    
    if (!availability) {
      return (
        <div className={cn(
          "h-8 w-8 flex items-center justify-center text-sm rounded-md",
          isPast ? "text-gray-400" : "text-gray-600",
          isSelected && "bg-blue-600 text-white"
        )}>
          {date.getDate()}
        </div>
      );
    }

    const isAvailable = availability.available && !isPast;
    const isFullyBooked = availability.inventory === availability.locked;
    const isLowAvailability = availability.inventory - availability.locked <= 2;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <div className={cn(
            "h-8 w-8 flex items-center justify-center text-sm rounded-md cursor-pointer transition-colors",
            isPast && "text-gray-400 cursor-not-allowed",
            isAvailable && !isPast && "hover:bg-blue-50",
            isSelected && "bg-blue-600 text-white",
            isToday && !isSelected && "bg-blue-100 text-blue-900",
            !isAvailable && !isPast && "bg-red-50 text-red-600",
            isLowAvailability && isAvailable && "bg-yellow-50 text-yellow-700"
          )}>
            {date.getDate()}
            {isLowAvailability && isAvailable && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full" />
            )}
            {isFullyBooked && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{format(date, 'MMM dd, yyyy')}</h4>
              <Badge variant={isAvailable ? "default" : "destructive"}>
                {isAvailable ? "Available" : "Unavailable"}
              </Badge>
            </div>
            
            {availability && (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-gray-500" />
                    <span>Inventory: {availability.inventory}</span>
                  </div>
                  <div className="flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-gray-500" />
                    <span>Locked: {availability.locked}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Price</span>
                  <span className="text-lg font-bold">₹{availability.price}</span>
                </div>
                
                {availability.metadata?.pricing && (
                  <PricingTooltip 
                    pricing={availability.metadata.pricing} 
                    availability={availability} 
                  />
                )}
                
                {isAvailable && (
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleDateSelect(date)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Select Date
                  </Button>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  // Get availability summary
  const availabilitySummary = useMemo(() => {
    const total = availability.length;
    const available = availability.filter(a => a.available).length;
    const locked = availability.reduce((sum, a) => sum + a.locked, 0);
    const avgPrice = availability.length > 0 
      ? Math.round(availability.reduce((sum, a) => sum + a.price, 0) / availability.length)
      : 0;
    
    return { total, available, locked, avgPrice };
  }, [availability]);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
              Availability Calendar
            </CardTitle>
            <CardDescription>{itemName}</CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAvailability}
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
            
            <div className="flex items-center space-x-1">
              {priceTrend === 'up' && <TrendingUp className="w-4 h-4 text-red-600" />}
              {priceTrend === 'down' && <TrendingDown className="w-4 h-4 text-green-600" />}
              {priceTrend === 'stable' && <Minus className="w-4 h-4 text-gray-600" />}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Availability Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{availabilitySummary.available}</div>
            <div className="text-sm text-blue-800">Available Days</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{availabilitySummary.total}</div>
            <div className="text-sm text-green-800">Total Days</div>
          </div>
          
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{availabilitySummary.locked}</div>
            <div className="text-sm text-yellow-800">Locked Items</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">₹{availabilitySummary.avgPrice}</div>
            <div className="text-sm text-purple-800">Avg Price</div>
          </div>
        </div>

        {/* Calendar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Select Date</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(subDays(currentMonth, 1))}
              >
                Previous
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addDays(currentMonth, 1))}
              >
                Next
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 p-4 border rounded-lg">
              {/* Calendar Header */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {Array.from({ length: 35 }, (_, i) => {
                const date = new Date(currentMonth);
                date.setDate(1);
                date.setDate(date.getDate() - date.getDay() + i);
                return renderDay(date);
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-2" />
            <span>Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded mr-2" />
            <span>Low Availability</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded mr-2" />
            <span>Unavailable</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded mr-2" />
            <span>Today</span>
          </div>
        </div>

        {/* Price Alert */}
        {priceTrend === 'up' && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Price Alert:</strong> Prices are trending upward. Book soon to secure current rates.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarAvailabilityView;
