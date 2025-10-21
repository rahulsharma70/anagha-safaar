import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Award, Users, Globe, Heart } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Heart,
      title: "Customer First",
      description: "Your satisfaction and memorable experiences are our top priority.",
    },
    {
      icon: Award,
      title: "Quality Assurance",
      description: "Every hotel, tour, and flight is carefully vetted for excellence.",
    },
    {
      icon: Users,
      title: "Expert Team",
      description: "Our travel specialists bring decades of combined experience.",
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Access to destinations and experiences worldwide.",
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
              About Anagha Safar
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Your trusted partner in crafting unforgettable journeys since our inception
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-foreground mb-4">Our Story</h2>
              <div className="w-24 h-1 bg-accent mx-auto"></div>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Anagha Safar was born from a simple belief: travel should be more than just visiting places—it should be about touching the soul, creating memories, and experiencing authentic connections with the world around us.
              </p>

              <p className="text-lg text-muted-foreground leading-relaxed mt-6">
                Based in the heart of Udaipur, Rajasthan, we've dedicated ourselves to curating exceptional travel experiences that blend luxury with authenticity. From the serene backwaters of Kerala to the spiritual ghats of Varanasi, from the majestic Himalayas to the vibrant culture of Rajasthan—we bring you closer to India's incredible diversity.
              </p>

              <p className="text-lg text-muted-foreground leading-relaxed mt-6">
                Our team of passionate travel experts works tirelessly to handpick every hotel, craft every tour, and secure the best flight options. We believe in sustainable tourism that respects local communities and preserves the beauty of our destinations for future generations.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="bg-muted py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-foreground mb-4">Our Values</h2>
              <p className="text-lg text-muted-foreground">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="bg-card p-6 rounded-xl shadow-sm hover:shadow-md transition-smooth text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-ocean mb-4">
                    <value.icon className="h-8 w-8 text-secondary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-accent mb-2">10K+</div>
              <div className="text-muted-foreground">Happy Travelers</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-accent mb-2">500+</div>
              <div className="text-muted-foreground">Tour Packages</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-accent mb-2">150+</div>
              <div className="text-muted-foreground">Destinations</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-accent mb-2">4.9</div>
              <div className="text-muted-foreground">Average Rating</div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="gradient-hero py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Let us help you create memories that will last a lifetime
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/tours">
                <button className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-smooth">
                  Explore Tours
                </button>
              </a>
              <a href="/auth">
                <button className="px-8 py-3 bg-primary-foreground text-primary rounded-lg font-semibold hover:bg-primary-foreground/90 transition-smooth">
                  Get Started
                </button>
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
