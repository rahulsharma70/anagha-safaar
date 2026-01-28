import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "How can I modify or cancel my booking?",
    answer: "You can modify or cancel your booking through your dashboard or by contacting our support team. Cancellation policies vary depending on the type of booking and how close to the travel date you are."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit/debit cards, UPI, net banking, and popular wallets like Paytm and PhonePe. EMI options are also available on select bookings."
  },
  {
    question: "How do I get a refund?",
    answer: "Refunds are processed within 5-7 business days after cancellation approval. The amount credited depends on the cancellation policy of your booking."
  },
  {
    question: "Can I change the traveler name on my booking?",
    answer: "Name changes depend on the airline/hotel policy. For flights, most airlines charge a fee for name corrections. Contact us within 24 hours of booking for the best assistance."
  },
  {
    question: "Do you offer travel insurance?",
    answer: "Yes! We offer comprehensive travel insurance covering trip cancellation, medical emergencies, lost baggage, and more. You can add it during checkout."
  },
  {
    question: "How do I contact customer support?",
    answer: "You can reach us via phone at +91 9039939555, email at support@anaghasafar.com, or use the contact form on this page. We respond within 2 hours!"
  }
];

const ContactFAQ = () => {
  return (
    <Card className="mt-12">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <HelpCircle className="h-6 w-6 text-primary" />
          Frequently Asked Questions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left hover:text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default ContactFAQ;
