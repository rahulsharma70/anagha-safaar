import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import PackageCard from "@/components/PackageCard";
import { Button } from "@/components/ui/button";
import { Sparkles, Award, Shield, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-travel.jpg";
import himalayanRetreat from "@/assets/himalayan-retreat.jpg";
import varanasiGhats from "@/assets/varanasi-ghats.jpg";
import keralaBackwaters from "@/assets/kerala-backwaters.jpg";
import rajasthanHeritage from "@/assets/rajasthan-heritage.jpg";

const Index = () => {
  const featuredPackages = [
    {
      image: himalayanRetreat,
      title: "Luxury Himalayan Retreat",
      location: "Dharamshala, HP",
      duration: "5 Days",
      rating: 4.9,
      reviews: 234,
      price: 45000,
      badge: "Popular",
      href: "/tours/luxury-himalayan-retreat",
    },
    {
      image: varanasiGhats,
      title: "Spiritual Varanasi Tour",
      location: "Varanasi, UP",
      duration: "3 Days",
      rating: 4.8,
      reviews: 189,
      price: 28000,
      href: "/tours/spiritual-varanasi-tour",
    },
    {
      image: keralaBackwaters,
      title: "Kerala Backwaters Cruise",
      location: "Alleppey, Kerala",
      duration: "4 Days",
      rating: 4.9,
      reviews: 312,
      price: 52000,
      badge: "Luxury",
      href: "/tours/kerala-backwaters-cruise",
    },
    {
      image: rajasthanHeritage,
      title: "Rajasthan Heritage Trail",
      location: "Jaipur, Rajasthan",
      duration: "7 Days",
      rating: 4.7,
      reviews: 267,
      price: 68000,
      href: "/tours/rajasthan-heritage-trail",
    },
  ];

  const features = [
    {
      icon: Award,
      title: "Best Price Guarantee",
      description: "Find a lower price? We'll match it.",
    },
    {
      icon: Shield,
      title: "Secure Booking",
      description: "Your data is safe with us.",
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description: "We're here whenever you need us.",
    },
    {
      icon: Sparkles,
      title: "Curated Experiences",
      description: "Handpicked journeys for you.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${heroImage})`,
            }}
          >
            <div className="mt-5 absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-primary/70" />
          </div>

          <div className="relative z-10 text-center px-4 space-y-6 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground animate-fade-in">
              Crafting Journeys That Touch the Soul
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 animate-fade-in-up">
              Discover luxury hotels, spiritual tours, and unforgettable experiences
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up">
              <Link to="/tours">
                <Button variant="hero" size="lg">
                  Explore Packages
                </Button>
              </Link>
              <Link to="/hotels">
                <Button variant="secondary" size="lg">
                  View Hotels
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Search Bar */}
        <section className="container mx-auto px-4 -mt-16 relative z-20">
          <SearchBar />
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center space-y-3 p-6 rounded-xl bg-card shadow-sm hover:shadow-md transition-smooth animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-ocean">
                  <feature.icon className="h-8 w-8 text-secondary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Packages */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Featured Experiences</h2>
            <p className="text-lg text-muted-foreground">Handpicked journeys for the discerning traveler</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredPackages.map((pkg, index) => (
              <div key={index} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                <PackageCard {...pkg} />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/tours">
              <Button variant="hero" size="lg">
                View All Packages
              </Button>
            </Link>
          </div>
        </section>

        {/* CTA Section */}
        <section className="gradient-hero py-20 mt-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Join thousands of happy travelers who trusted us with their dream vacations
            </p>
            <Link to="/auth">
              <Button variant="hero" size="lg">
                Get Started Today
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
