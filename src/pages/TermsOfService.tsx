import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <section className="gradient-ocean py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-secondary-foreground">Terms of Service</h1>
            <p className="text-lg text-secondary-foreground/90 max-w-2xl mx-auto">
              Please read these terms carefully before using our services
            </p>
            <p className="text-sm text-secondary-foreground/80 mt-4">Last updated: January 2025</p>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Agreement to Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Welcome to Anagha Safaar. By accessing or using our website and services, you agree to be bound by these 
                  Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our services.
                </p>
                <p>
                  These Terms constitute a legally binding agreement between you and Anagha Safaar. We reserve the right 
                  to modify these Terms at any time, and such modifications will be effective immediately upon posting.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Use of Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Eligibility</h3>
                  <p>
                    You must be at least 18 years old to use our services. By using our platform, you represent and warrant 
                    that you are of legal age to form a binding contract.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Account Registration</h3>
                  <p>To access certain features, you may need to create an account. You agree to:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Provide accurate and complete information</li>
                    <li>Maintain the security of your password and account</li>
                    <li>Notify us immediately of any unauthorized access</li>
                    <li>Be responsible for all activities under your account</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Prohibited Activities</h3>
                  <p>You agree not to:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Use the services for any illegal purpose</li>
                    <li>Violate any laws or regulations</li>
                    <li>Infringe on intellectual property rights</li>
                    <li>Transmit viruses, malware, or harmful code</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Interfere with the proper functioning of our services</li>
                    <li>Engage in fraudulent activities or misrepresentation</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Booking and Payments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Booking Process</h3>
                  <p>
                    When you make a booking through our platform, you enter into a contract with the respective service 
                    provider (hotel, airline, tour operator, etc.). We act as an intermediary to facilitate bookings.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Pricing and Availability</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Prices are subject to change without notice until booking is confirmed</li>
                    <li>All prices are displayed in Indian Rupees (INR) unless otherwise stated</li>
                    <li>We strive for accuracy but cannot guarantee real-time availability</li>
                    <li>Promotional rates may have specific terms and restrictions</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Payment Terms</h3>
                  <p>
                    Payment must be made at the time of booking. We accept major credit/debit cards and UPI. 
                    All transactions are processed through secure payment gateways. Additional charges may apply 
                    for certain payment methods.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Booking Confirmation</h3>
                  <p>
                    Your booking is confirmed only when you receive a confirmation email from us. Please review 
                    all details carefully and contact us immediately if there are any discrepancies.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Cancellations and Refunds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Cancellation and refund policies vary by service type and provider. Please refer to our detailed 
                  Cancellation Policy page for complete information. By making a booking, you agree to the applicable 
                  cancellation terms.
                </p>
                <p>
                  Service providers reserve the right to cancel bookings in exceptional circumstances. In such cases, 
                  we will notify you promptly and assist with alternative arrangements or refunds.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Travel Documents and Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  You are responsible for ensuring you have all necessary travel documents including:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Valid identification documents</li>
                  <li>Passports and visas (for international travel)</li>
                  <li>Health certificates and vaccination records (where required)</li>
                  <li>Travel insurance (recommended)</li>
                </ul>
                <p>
                  We are not responsible for any issues arising from inadequate or incorrect travel documentation.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Anagha Safaar acts as an intermediary between you and travel service providers. We are not liable for:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Acts or omissions of third-party service providers</li>
                  <li>Changes in services, schedules, or facilities by providers</li>
                  <li>Personal injury, death, property damage, or delays</li>
                  <li>Force majeure events (natural disasters, political unrest, pandemics, etc.)</li>
                  <li>Loss of personal belongings or valuables</li>
                  <li>Indirect, consequential, or incidental damages</li>
                </ul>
                <p>
                  Our maximum liability is limited to the amount you paid for the booking through our platform.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Intellectual Property</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  All content on our website, including text, graphics, logos, images, and software, is the property of 
                  Anagha Safaar or its licensors and is protected by copyright and trademark laws.
                </p>
                <p>
                  You may not reproduce, distribute, modify, or create derivative works without our express written permission.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>User Content and Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  You may submit reviews, ratings, and feedback about our services. By doing so, you grant us a 
                  non-exclusive, royalty-free license to use, reproduce, and display your content.
                </p>
                <p>
                  You agree that your submissions will be:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Truthful and based on your personal experience</li>
                  <li>Non-defamatory and respectful</li>
                  <li>Free from offensive or inappropriate content</li>
                  <li>Not promotional or commercial in nature</li>
                </ul>
                <p>
                  We reserve the right to remove any content that violates these Terms.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Dispute Resolution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Complaints and Support</h3>
                  <p>
                    If you have any complaints or issues, please contact our customer support team. We will make 
                    reasonable efforts to resolve disputes amicably.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Governing Law</h3>
                  <p>
                    These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive 
                    jurisdiction of the courts in Mumbai, Maharashtra.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Indemnification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  You agree to indemnify and hold Anagha Safaar harmless from any claims, damages, liabilities, and 
                  expenses arising from your use of our services, violation of these Terms, or infringement of any rights.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Termination</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We reserve the right to suspend or terminate your account and access to our services at any time, 
                  without notice, for violation of these Terms or for any other reason at our discretion.
                </p>
                <p>
                  Upon termination, all provisions that should reasonably survive termination will continue to apply.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Severability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions 
                  will continue in full force and effect.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-4">
                  For questions about these Terms of Service, please contact us:
                </p>
                <div className="space-y-2">
                  <p><strong>Email:</strong> legal@anaghasafaar.com</p>
                  <p><strong>Phone:</strong> +91 98765 43210</p>
                  <p><strong>Address:</strong> 123 Travel Plaza, Mumbai, Maharashtra 400001, India</p>
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

export default TermsOfService;
