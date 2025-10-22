import { useBooking } from '@/contexts/BookingContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Calendar, Users, MapPin, CreditCard } from 'lucide-react';

export const ReviewStep = () => {
  const { bookingData, getTotalPrice, nextStep, prevStep } = useBooking();

  if (!bookingData) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No booking data available. Please start from the beginning.</p>
        </CardContent>
      </Card>
    );
  }

  const nights = bookingData.type === 'hotel' && bookingData.tripSelection.startDate && bookingData.tripSelection.endDate
    ? Math.ceil(
        (bookingData.tripSelection.endDate.getTime() - bookingData.tripSelection.startDate.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review Your Booking</h2>
        <p className="text-muted-foreground">
          Please verify all details before proceeding to payment
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {bookingData.type.charAt(0).toUpperCase() + bookingData.type.slice(1)} Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="font-semibold text-lg">{bookingData.itemName}</h3>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Trip Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {bookingData.tripSelection.startDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {bookingData.type === 'flight' ? 'Departure' : 'Check-in'}:
                  </span>
                  <span className="font-medium">
                    {format(bookingData.tripSelection.startDate, 'PPP')}
                  </span>
                </div>
              )}
              {bookingData.type === 'hotel' && bookingData.tripSelection.endDate && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check-out:</span>
                    <span className="font-medium">
                      {format(bookingData.tripSelection.endDate, 'PPP')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nights:</span>
                    <span className="font-medium">{nights}</span>
                  </div>
                </>
              )}
              {bookingData.type === 'flight' && bookingData.tripSelection.flightClass && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Class:</span>
                  <span className="font-medium capitalize">
                    {bookingData.tripSelection.flightClass}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Guest Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {bookingData.guestDetails.map((guest, index) => (
                <div key={guest.id}>
                  {index > 0 && <Separator className="my-3" />}
                  <div className="space-y-1">
                    <p className="font-medium">
                      {guest.firstName} {guest.lastName}
                    </p>
                    {index === 0 && (
                      <>
                        <p className="text-sm text-muted-foreground">{guest.email}</p>
                        <p className="text-sm text-muted-foreground">{guest.phone}</p>
                      </>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {guest.idType.toUpperCase()}: {guest.idNumber}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {(bookingData.addOns.travelInsurance || bookingData.addOns.mealPlan || bookingData.addOns.specialRequests) && (
            <Card>
              <CardHeader>
                <CardTitle>Add-ons & Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {bookingData.addOns.travelInsurance && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Travel Insurance</span>
                    <span className="font-medium">Included</span>
                  </div>
                )}
                {bookingData.addOns.mealPlan && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Meal Plan</span>
                    <span className="font-medium capitalize">
                      {bookingData.addOns.mealPlan.replace('-', ' ')}
                    </span>
                  </div>
                )}
                {bookingData.addOns.specialRequests && (
                  <div>
                    <p className="text-muted-foreground mb-1">Special Requests:</p>
                    <p className="text-sm">{bookingData.addOns.specialRequests}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Price Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Base Price {bookingData.type === 'hotel' && `(${nights} nights)`}
                  </span>
                  <span>₹{(bookingData.basePrice * (nights || 1) * bookingData.tripSelection.guestsCount).toLocaleString()}</span>
                </div>
                {bookingData.addOns.travelInsurance && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Travel Insurance</span>
                    <span>₹{(500 * bookingData.tripSelection.guestsCount).toLocaleString()}</span>
                  </div>
                )}
                {bookingData.addOns.mealPlan && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Meal Plan</span>
                    <span>
                      ₹
                      {bookingData.addOns.mealPlan === 'breakfast'
                        ? '500'
                        : bookingData.addOns.mealPlan === 'half-board'
                        ? '1,200'
                        : '2,000'}
                    </span>
                  </div>
                )}
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount</span>
                <span>₹{getTotalPrice().toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button onClick={nextStep} size="lg">
          Next: Terms & Conditions
        </Button>
      </div>
    </div>
  );
};
