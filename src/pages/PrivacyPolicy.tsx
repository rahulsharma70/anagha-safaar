import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <section className="gradient-ocean py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-secondary-foreground">Privacy Policy</h1>
            <p className="text-lg text-secondary-foreground/90 max-w-2xl mx-auto">
              Your privacy is important to us. Learn how we collect, use, and protect your information.
            </p>
            <p className="text-sm text-secondary-foreground/80 mt-4">Last updated: January 2025</p>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Introduction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Welcome to Anagha Safaar. We are committed to protecting your personal information and your right to privacy. 
                  This Privacy Policy explains what information we collect, how we use it, and what rights you have in relation to it.
                </p>
                <p>
                  By using our services, you agree to the collection and use of information in accordance with this policy.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Personal Information</h3>
                  <p>When you register or make a booking, we may collect:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Name and contact information (email address, phone number)</li>
                    <li>Billing and payment information</li>
                    <li>Travel preferences and special requirements</li>
                    <li>Identification documents (as required for bookings)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Automatically Collected Information</h3>
                  <p>When you use our website, we automatically collect:</p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Device information (IP address, browser type, operating system)</li>
                    <li>Usage data (pages visited, time spent, click patterns)</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>We use your information to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Process and manage your bookings</li>
                  <li>Communicate with you about your reservations and account</li>
                  <li>Send booking confirmations and updates</li>
                  <li>Provide customer support</li>
                  <li>Improve our services and website functionality</li>
                  <li>Send promotional offers and newsletters (with your consent)</li>
                  <li>Comply with legal obligations and prevent fraud</li>
                  <li>Analyze usage patterns to enhance user experience</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Information Sharing and Disclosure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>We may share your information with:</p>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Service Providers</h3>
                  <p>Hotels, airlines, tour operators, and other travel service providers necessary to fulfill your bookings.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Payment Processors</h3>
                  <p>Secure payment gateways to process your transactions. We do not store your complete credit card information.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Third-Party Service Providers</h3>
                  <p>Analytics, marketing, and customer service tools that help us improve our services.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Legal Requirements</h3>
                  <p>When required by law, court order, or government authority.</p>
                </div>
                <p className="text-sm mt-4">
                  We do not sell your personal information to third parties for their marketing purposes.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Data Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We implement industry-standard security measures to protect your personal information from unauthorized access, 
                  alteration, disclosure, or destruction. These measures include:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Encryption of sensitive data during transmission (SSL/TLS)</li>
                  <li>Secure storage with access controls</li>
                  <li>Regular security audits and monitoring</li>
                  <li>Employee training on data protection</li>
                </ul>
                <p>
                  However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Cookies and Tracking Technologies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, 
                  and understand user preferences. You can control cookie settings through your browser preferences.
                </p>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Types of Cookies We Use</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Essential Cookies:</strong> Required for basic site functionality</li>
                    <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site</li>
                    <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Your Rights and Choices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access and review your personal information</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your personal information</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Withdraw consent for data processing (where applicable)</li>
                  <li>Data portability (receive your data in a structured format)</li>
                </ul>
                <p>
                  To exercise these rights, please contact us at privacy@anaghasafaar.com or through your account dashboard.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Children's Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Our services are not intended for individuals under the age of 18. We do not knowingly collect personal 
                  information from children. If you believe we have collected information from a child, please contact us 
                  immediately so we can delete it.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>International Data Transfers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Your information may be transferred to and maintained on servers located outside your state, province, 
                  country, or other governmental jurisdiction. We take steps to ensure that your data receives adequate 
                  protection in accordance with this Privacy Policy.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Changes to This Privacy Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the 
                  new policy on this page and updating the "Last updated" date. Significant changes will be communicated 
                  via email or a prominent notice on our website.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p className="mb-4">
                  If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="space-y-2">
                  <p><strong>Email:</strong> privacy@anaghasafaar.com</p>
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

export default PrivacyPolicy;
