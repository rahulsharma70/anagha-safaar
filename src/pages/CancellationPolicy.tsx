import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CancellationPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <section className="gradient-ocean py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-secondary-foreground">Cancellation Policy</h1>
            <p className="text-lg text-secondary-foreground/90 max-w-2xl mx-auto">
              Understand our cancellation terms and refund procedures
            </p>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>General Cancellation Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  At Anagha Safaar, we understand that plans can change. Our cancellation policy is designed to be fair and transparent while protecting both our customers and service providers.
                </p>
                <p>
                  The specific cancellation terms may vary depending on the type of service (hotels, tours, or flights) and the individual service provider's policies. Please review the terms carefully before making a booking.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Hotel Bookings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Standard Cancellation</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Cancellations made 48 hours or more before check-in: 100% refund</li>
                    <li>Cancellations made 24-48 hours before check-in: 50% refund</li>
                    <li>Cancellations made less than 24 hours before check-in: No refund</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Non-Refundable Bookings</h3>
                  <p>Some promotional rates and special offers may be non-refundable. These will be clearly marked during the booking process.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Tour Packages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Cancellation Timeline</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>More than 30 days before tour start: 90% refund (10% processing fee)</li>
                    <li>15-30 days before tour start: 50% refund</li>
                    <li>7-14 days before tour start: 25% refund</li>
                    <li>Less than 7 days before tour start: No refund</li>
                  </ul>
                </div>
                <p className="text-sm">
                  Note: Multi-day tour packages may have different cancellation terms based on the tour operator's policies.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Flight Bookings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Flight cancellation policies are determined by the airline and fare type. Common scenarios include:
                </p>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Refundable Tickets</h3>
                  <p>Can be cancelled for a full or partial refund as per airline policy, minus any applicable service fees.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Non-Refundable Tickets</h3>
                  <p>May not be eligible for refund, but may allow changes with applicable fees. In case of airline cancellations, full refunds are provided.</p>
                </div>
                <p className="text-sm">
                  Please check the specific fare rules during booking for detailed cancellation terms.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Refund Process</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">How to Request a Cancellation</h3>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Log in to your account and go to your Dashboard</li>
                    <li>Navigate to "My Bookings"</li>
                    <li>Select the booking you wish to cancel</li>
                    <li>Click on "Cancel Booking" and follow the prompts</li>
                  </ol>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Refund Timeline</h3>
                  <p>
                    Once your cancellation is approved, refunds are typically processed within 5-7 business days. 
                    The amount will be credited to your original payment method. Depending on your bank or card issuer, 
                    it may take an additional 2-3 business days for the refund to reflect in your account.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Force Majeure & Special Circumstances</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  In cases of natural disasters, medical emergencies, government travel restrictions, or other extraordinary circumstances, 
                  we will work with service providers to offer flexible cancellation options or travel credits.
                </p>
                <p>
                  Documentation may be required to qualify for special consideration under force majeure conditions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-4">
                  For questions about cancellations or to request assistance, please contact our support team:
                </p>
                <div className="space-y-2">
                  <p><strong>Email:</strong> support@anaghasafaar.com</p>
                  <p><strong>Phone:</strong> +91 98765 43210</p>
                  <p><strong>Hours:</strong> Monday - Saturday, 9:00 AM - 6:00 PM IST</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CancellationPolicy;
