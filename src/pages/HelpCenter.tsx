import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      category: "Booking & Payments",
      questions: [
        {
          q: "How do I make a booking?",
          a: "Browse our hotels, tours, or flights, select your preferred option, fill in the booking form with your details, and proceed to payment. You'll receive a confirmation email once your booking is complete."
        },
        {
          q: "What payment methods do you accept?",
          a: "We accept all major credit cards, debit cards, and UPI payments through our secure payment gateway powered by Razorpay."
        },
        {
          q: "Is my payment information secure?",
          a: "Yes, all payment transactions are encrypted and processed through secure payment gateways. We do not store your credit card information."
        }
      ]
    },
    {
      category: "Cancellations & Refunds",
      questions: [
        {
          q: "What is your cancellation policy?",
          a: "Cancellation policies vary by service provider. Generally, cancellations made 48 hours before the booking date are eligible for a full refund. Please check our Cancellation Policy page for detailed information."
        },
        {
          q: "How do I cancel my booking?",
          a: "Log in to your dashboard, go to 'My Bookings', select the booking you want to cancel, and click 'Cancel Booking'. Follow the prompts to complete the cancellation."
        },
        {
          q: "When will I receive my refund?",
          a: "Refunds are typically processed within 5-7 business days after cancellation approval. The amount will be credited to your original payment method."
        }
      ]
    },
    {
      category: "Account & Profile",
      questions: [
        {
          q: "How do I create an account?",
          a: "Click on 'Sign In' in the navigation bar, then select 'Sign Up'. Fill in your details including name, email, and password to create your account."
        },
        {
          q: "I forgot my password. What should I do?",
          a: "Click on 'Sign In', then select 'Forgot Password'. Enter your registered email address, and we'll send you instructions to reset your password."
        },
        {
          q: "How do I update my profile information?",
          a: "Log in to your account, go to your Dashboard, and click on 'Profile Settings'. You can update your name, contact information, and preferences there."
        }
      ]
    },
    {
      category: "Travel Services",
      questions: [
        {
          q: "Do you provide travel insurance?",
          a: "Travel insurance options are available during the booking process. We partner with leading insurance providers to offer comprehensive coverage for your trip."
        },
        {
          q: "Can I modify my booking dates?",
          a: "Modification requests depend on the service provider's policy. Contact our support team through your dashboard, and we'll help you with the modification process."
        },
        {
          q: "Do you offer group bookings?",
          a: "Yes, we offer special packages for group bookings. Please contact our support team with your requirements for customized group travel solutions."
        }
      ]
    }
  ];

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      item =>
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <section className="gradient-ocean py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-secondary-foreground">Help Center</h1>
            <p className="text-lg text-secondary-foreground/90 mb-8 max-w-2xl mx-auto">
              Find answers to frequently asked questions and get the support you need
            </p>
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 max-w-4xl">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((category, idx) => (
                <Card key={idx} className="mb-8">
                  <CardHeader>
                    <CardTitle>{category.category}</CardTitle>
                    <CardDescription>Frequently asked questions about {category.category.toLowerCase()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((item, qIdx) => (
                        <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`}>
                          <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {item.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                </CardContent>
              </Card>
            )}

            <Card className="mt-12">
              <CardHeader>
                <CardTitle>Still need help?</CardTitle>
                <CardDescription>Our support team is here to assist you</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">
                  If you couldn't find the answer to your question, please don't hesitate to reach out to us.
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

export default HelpCenter;
