import { useState } from 'react';
import { useBooking } from '@/contexts/BookingContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const TermsStep = () => {
  const { bookingData, updateTermsAccepted, nextStep, prevStep } = useBooking();
  const [accepted, setAccepted] = useState(bookingData?.termsAccepted || false);
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!accepted) {
      setError('You must accept the terms and conditions to proceed');
      return;
    }
    updateTermsAccepted(true);
    nextStep();
  };

  const handleAcceptChange = (checked: boolean) => {
    setAccepted(checked);
    if (checked) setError('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold mb-2">Terms & Conditions</h2>
        <p className="text-muted-foreground">
          Please review and accept our terms before proceeding
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] rounded-md border p-4">
            <div className="space-y-4 text-sm">
              <section>
                <h3 className="font-semibold mb-2">1. Booking Confirmation</h3>
                <p className="text-muted-foreground">
                  Your booking is confirmed only after successful payment. You will receive a
                  confirmation email with booking details and reference number.
                </p>
              </section>

              <section>
                <h3 className="font-semibold mb-2">2. Cancellation Policy</h3>
                <p className="text-muted-foreground mb-2">
                  Cancellation charges apply as follows:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>More than 30 days before travel: 25% of booking amount</li>
                  <li>15-30 days before travel: 50% of booking amount</li>
                  <li>7-14 days before travel: 75% of booking amount</li>
                  <li>Less than 7 days: 100% of booking amount (no refund)</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold mb-2">3. Payment Terms</h3>
                <p className="text-muted-foreground">
                  Full payment is required at the time of booking. We accept credit cards,
                  debit cards, UPI, and net banking. All payments are processed securely.
                </p>
              </section>

              <section>
                <h3 className="font-semibold mb-2">4. Modification Policy</h3>
                <p className="text-muted-foreground">
                  Changes to bookings are subject to availability and may incur additional
                  charges. Modifications must be requested at least 7 days before travel.
                </p>
              </section>

              <section>
                <h3 className="font-semibold mb-2">5. Travel Documents</h3>
                <p className="text-muted-foreground">
                  Travelers are responsible for ensuring they have valid identification and
                  travel documents. For international travel, valid passports and visas are
                  required.
                </p>
              </section>

              <section>
                <h3 className="font-semibold mb-2">6. Liability</h3>
                <p className="text-muted-foreground">
                  We act as an intermediary between you and service providers. We are not
                  liable for any loss, damage, or injury arising from services provided by
                  third parties.
                </p>
              </section>

              <section>
                <h3 className="font-semibold mb-2">7. Force Majeure</h3>
                <p className="text-muted-foreground">
                  We are not liable for failure to perform due to circumstances beyond our
                  control, including natural disasters, strikes, or government actions.
                </p>
              </section>

              <section>
                <h3 className="font-semibold mb-2">8. Privacy Policy</h3>
                <p className="text-muted-foreground">
                  Your personal information will be processed in accordance with our Privacy
                  Policy. We do not share your data with third parties without consent.
                </p>
              </section>

              <section>
                <h3 className="font-semibold mb-2">9. Complaints & Disputes</h3>
                <p className="text-muted-foreground">
                  Any complaints must be reported within 7 days of service completion. 
                  Disputes will be resolved through arbitration in accordance with local laws.
                </p>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={accepted}
              onCheckedChange={handleAcceptChange}
            />
            <div className="space-y-1">
              <Label htmlFor="terms" className="cursor-pointer leading-relaxed">
                I have read and agree to the Terms & Conditions, Cancellation Policy, and
                Privacy Policy
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={!accepted} size="lg">
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
};
