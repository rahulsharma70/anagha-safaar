import { useState, useEffect } from 'react';
import { useBooking } from '@/contexts/BookingContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Minus, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const TripSelectionStep = () => {
  const { bookingData, updateTripSelection, nextStep } = useBooking();
  
  const [startDate, setStartDate] = useState<Date | undefined>(bookingData?.tripSelection.startDate);
  const [endDate, setEndDate] = useState<Date | undefined>(bookingData?.tripSelection.endDate);
  const [guestsCount, setGuestsCount] = useState(bookingData?.tripSelection.guestsCount || 1);
  const [flightClass, setFlightClass] = useState<'economy' | 'business'>(
    bookingData?.tripSelection.flightClass || 'economy'
  );

  const handleNext = () => {
    if (!startDate) return;
    
    updateTripSelection({
      startDate,
      endDate: bookingData?.type === 'hotel' ? endDate : undefined,
      guestsCount,
      flightClass: bookingData?.type === 'flight' ? flightClass : undefined,
    });
    nextStep();
  };

  const isValid = startDate && (bookingData?.type !== 'hotel' || endDate) && guestsCount > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select Your Trip Details</h2>
        <p className="text-muted-foreground">
          Choose your travel dates and number of {bookingData?.type === 'flight' ? 'passengers' : 'guests'}
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="start-date">
              {bookingData?.type === 'flight' ? 'Departure Date' : 'Check-in Date'}*
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {bookingData?.type === 'hotel' && (
            <div className="space-y-2">
              <Label htmlFor="end-date">Check-out Date*</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => !startDate || date <= startDate}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {bookingData?.type === 'flight' && (
          <div className="space-y-2">
            <Label htmlFor="flight-class">Class*</Label>
            <Select value={flightClass} onValueChange={(value: 'economy' | 'business') => setFlightClass(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="economy">Economy</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>
            {bookingData?.type === 'flight' ? 'Number of Passengers' : 'Number of Guests'}*
          </Label>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
              disabled={guestsCount <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-2xl font-semibold w-12 text-center">{guestsCount}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setGuestsCount(Math.min(10, guestsCount + 1))}
              disabled={guestsCount >= 10}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleNext} disabled={!isValid} size="lg">
          Next: Guest Details
        </Button>
      </div>
    </div>
  );
};
