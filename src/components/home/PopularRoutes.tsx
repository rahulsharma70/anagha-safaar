import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Plane, ArrowRight, TrendingUp } from "lucide-react";

const routes = [
  { from: "Delhi", to: "Mumbai", price: 2499, trend: "+15%" },
  { from: "Delhi", to: "Bangalore", price: 2999, trend: "+8%" },
  { from: "Mumbai", to: "Goa", price: 1999, trend: "+22%" },
  { from: "Delhi", to: "Goa", price: 3499, trend: "+12%" },
  { from: "Bangalore", to: "Delhi", price: 2799, trend: "+5%" },
  { from: "Mumbai", to: "Delhi", price: 2599, trend: "+10%" },
  { from: "Chennai", to: "Delhi", price: 3299, trend: "+7%" },
  { from: "Kolkata", to: "Mumbai", price: 3999, trend: "+18%" },
];

export const PopularRoutes = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-500 px-4 py-2 rounded-full mb-4">
            <Plane className="h-4 w-4" />
            <span className="text-sm font-medium">Most Searched</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Popular <span className="text-blue-500">Flight Routes</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find the best deals on most popular domestic routes
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {routes.map((route, index) => (
            <motion.div
              key={`${route.from}-${route.to}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/flights?from=${route.from}&to=${route.to}`}>
                <div className="group bg-card rounded-xl border border-border/50 p-4 hover:border-primary/50 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{route.from}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="font-semibold">{route.to}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-green-500">
                      <TrendingUp className="w-3 h-3" />
                      {route.trend}
                    </div>
                  </div>
                  
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm text-muted-foreground">Starting from</span>
                    <span className="text-xl font-bold text-primary">
                      ₹{route.price.toLocaleString()}
                    </span>
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
