import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Clock, Flame, ArrowRight, Plane, Building2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const deals = [
  {
    id: 1,
    type: "flight",
    title: "Delhi to Goa",
    subtitle: "Round Trip Flight",
    originalPrice: 8999,
    salePrice: 4999,
    discount: 45,
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&h=300&fit=crop",
    endsIn: 7200, // seconds
    href: "/flights",
  },
  {
    id: 2,
    type: "hotel",
    title: "Taj Lake Palace",
    subtitle: "Udaipur • 5 Star",
    originalPrice: 25000,
    salePrice: 15999,
    discount: 36,
    image: "https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=400&h=300&fit=crop",
    endsIn: 10800,
    href: "/hotels",
  },
  {
    id: 3,
    type: "flight",
    title: "Mumbai to Dubai",
    subtitle: "One Way Flight",
    originalPrice: 15999,
    salePrice: 9999,
    discount: 38,
    image:
      "https://plus.unsplash.com/premium_photo-1679830513886-e09cd6dc3137?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8ZmxpZ2h0fGVufDB8fDB8fHww",
    endsIn: 5400,
    href: "/flights",
  },
  {
    id: 4,
    type: "hotel",
    title: "Beach Resort Goa",
    subtitle: "Goa • 4 Star",
    originalPrice: 12000,
    salePrice: 6999,
    discount: 42,
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop",
    endsIn: 14400,
    href: "/hotels",
  },
];

const CountdownTimer = ({ seconds }: { seconds: number }) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;

  return (
    <div className="flex items-center gap-1 text-sm font-mono">
      <div className="bg-destructive/10 text-destructive px-2 py-1 rounded">{hours.toString().padStart(2, "0")}</div>
      <span className="text-destructive">:</span>
      <div className="bg-destructive/10 text-destructive px-2 py-1 rounded">{minutes.toString().padStart(2, "0")}</div>
      <span className="text-destructive">:</span>
      <div className="bg-destructive/10 text-destructive px-2 py-1 rounded">{secs.toString().padStart(2, "0")}</div>
    </div>
  );
};

export const FlashDeals = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-10"
        >
          <div>
            <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-full mb-4">
              <Flame className="h-4 w-4" />
              <span className="text-sm font-medium">Flash Sale - Limited Time!</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Today's <span className="text-destructive">Hot Deals</span>
            </h2>
          </div>

          <Link to="/flights" className="mt-4 md:mt-0">
            <Button variant="outline" className="rounded-full">
              View All Deals
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {deals.map((deal, index) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group"
            >
              <Link to={deal.href}>
                <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm hover:shadow-xl transition-all">
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={deal.image}
                      alt={deal.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* Discount Badge */}
                    <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground">
                      {deal.discount}% OFF
                    </Badge>

                    {/* Type Badge */}
                    <Badge variant="secondary" className="absolute top-3 right-3">
                      {deal.type === "flight" ? (
                        <>
                          <Plane className="w-3 h-3 mr-1" /> Flight
                        </>
                      ) : (
                        <>
                          <Building2 className="w-3 h-3 mr-1" /> Hotel
                        </>
                      )}
                    </Badge>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{deal.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{deal.subtitle}</p>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-bold text-primary">₹{deal.salePrice.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground line-through">
                        ₹{deal.originalPrice.toLocaleString()}
                      </span>
                    </div>

                    {/* Timer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Ends in</span>
                      </div>
                      <CountdownTimer seconds={deal.endsIn} />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
