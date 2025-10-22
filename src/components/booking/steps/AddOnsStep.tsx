import { useState } from 'react';
import { useBooking } from '@/contexts/BookingContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Utensils } from 'lucide-react';

export const AddOnsStep = () => {
  const { bookingData, updateAddOns, nextStep, prevStep } = useBooking();
  
  const [travelInsurance, setTravelInsurance] = useState(
    bookingData?.addOns.travelInsurance || false
  );
  const [mealPlan, setMealPlan] = useState<'breakfast' | 'half-board' | 'full-board' | undefined>(
    bookingData?.addOns.mealPlan
  );
  const [specialRequests, setSpecialRequests] = useState(
    bookingData?.addOns.specialRequests || ''
  );

  const handleNext = () => {
    updateAddOns({
      travelInsurance,
      mealPlan,
      specialRequests,
    });
    nextStep();
  };

  const showMealPlan = bookingData?.type === 'hotel' || bookingData?.type === 'tour';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Add-ons & Preferences</h2>
        <p className="text-muted-foreground">
          Enhance your travel experience with optional services
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Travel Insurance</CardTitle>
            </div>
            <CardDescription>
              Protect your trip with comprehensive travel insurance coverage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="insurance"
                checked={travelInsurance}
                onCheckedChange={(checked) => setTravelInsurance(checked as boolean)}
              />
              <Label htmlFor="insurance" className="cursor-pointer">
                Add travel insurance (+₹500 per person)
              </Label>
            </div>
            {travelInsurance && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Coverage includes:</strong> Trip cancellation, medical emergencies, 
                  baggage loss, and flight delays.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {showMealPlan && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                <CardTitle>Meal Plan</CardTitle>
              </div>
              <CardDescription>
                Choose your preferred meal arrangement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={mealPlan} onValueChange={(value: any) => setMealPlan(value)}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="" id="no-meal" />
                    <Label htmlFor="no-meal" className="cursor-pointer">
                      No meal plan
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="breakfast" id="breakfast" />
                    <Label htmlFor="breakfast" className="cursor-pointer">
                      Breakfast only (+₹500)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="half-board" id="half-board" />
                    <Label htmlFor="half-board" className="cursor-pointer">
                      Half Board - Breakfast & Dinner (+₹1,200)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full-board" id="full-board" />
                    <Label htmlFor="full-board" className="cursor-pointer">
                      Full Board - All Meals (+₹2,000)
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Special Requests</CardTitle>
            <CardDescription>
              Any special requirements or preferences? (Optional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="E.g., late check-in, vegetarian meals, wheelchair access..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button onClick={handleNext} size="lg">
          Next: Review Booking
        </Button>
      </div>
    </div>
  );
};
