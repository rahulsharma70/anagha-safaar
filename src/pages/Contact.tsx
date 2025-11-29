import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field length limits
  const LIMITS = {
    name: 100,
    email: 255,
    phone: 20,
    subject: 200,
    message: 2000,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate lengths
    if (formData.name.length > LIMITS.name) {
      toast.error(`Name must be less than ${LIMITS.name} characters`);
      return;
    }
    if (formData.subject.length > LIMITS.subject) {
      toast.error(`Subject must be less than ${LIMITS.subject} characters`);
      return;
    }
    if (formData.message.length > LIMITS.message) {
      toast.error(`Message must be less than ${LIMITS.message} characters`);
      return;
    }

    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
      setIsSubmitting(false);
    }, 1500);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Visit Us",
      content: "Alkapuri Gwalior - M.P. (India)",
    },
    {
      icon: Phone,
      title: "Call Us",
      content: "+91 9039939555",
    },
    {
      icon: Mail,
      title: "Email Us",
      content: "support@anaghasafar.com",
    },
    {
      icon: Clock,
      title: "Working Hours",
      content: "Mon - Sat: 9:00 AM - 6:00 PM",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="gradient-hero py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground mb-4">
              Get in Touch
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  Contact Information
                </h2>
                <p className="text-muted-foreground mb-8">
                  Fill out the form and our team will get back to you within 24 hours.
                </p>
              </div>

              {contactInfo.map((info, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 rounded-full gradient-ocean">
                        <info.icon className="h-6 w-6 text-secondary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-card-foreground mb-1">
                          {info.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {info.content}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Send us a Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          Full Name * 
                          <span className="text-xs text-muted-foreground ml-2">
                            ({formData.name.length}/{LIMITS.name})
                          </span>
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          maxLength={LIMITS.name}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">
                          Email Address *
                          <span className="text-xs text-muted-foreground ml-2">
                            ({formData.email.length}/{LIMITS.email})
                          </span>
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="john@example.com"
                          maxLength={LIMITS.email}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          Phone Number
                          <span className="text-xs text-muted-foreground ml-2">
                            ({formData.phone.length}/{LIMITS.phone})
                          </span>
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+91 1234567890"
                          maxLength={LIMITS.phone}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">
                          Subject *
                          <span className="text-xs text-muted-foreground ml-2">
                            ({formData.subject.length}/{LIMITS.subject})
                          </span>
                        </Label>
                        <Input
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="How can we help?"
                          maxLength={LIMITS.subject}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">
                        Message *
                        <span className="text-xs text-muted-foreground ml-2">
                          ({formData.message.length}/{LIMITS.message})
                        </span>
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us more about your inquiry..."
                        rows={6}
                        maxLength={LIMITS.message}
                        required
                      />
                      {formData.message.length > LIMITS.message * 0.9 && (
                        <p className="text-xs text-warning">
                          Approaching character limit
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      variant="hero"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                      We respect your privacy. Your information will never be shared.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="container mx-auto px-4 pb-20">
          <Card className="overflow-hidden">
            <div className="w-full h-[450px]">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d229085.18221770864!2d78.02608252949295!3d26.21436995752023!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3976c5d1792291fb%3A0xff4fb56d65bc3adf!2sGwalior%2C%20Madhya%20Pradesh!5e0!3m2!1sen!2sin!4v1764413887593!5m2!1sen!2sin" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Anagha Safar Location"
              />
            </div>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
