import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Clock, Plane, Building2, MapPin, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// Simulated recent searches (in real app, this would come from localStorage or user data)
const mockRecentSearches = [
  {
    id: 1,
    type: "flight",
    from: "Delhi",
    to: "Mumbai",
    date: "15 Feb 2024",
    travelers: 2,
    href: "/flights?from=Delhi&to=Mumbai"
  },
  {
    id: 2,
    type: "hotel",
    destination: "Goa",
    checkIn: "20 Feb",
    checkOut: "23 Feb",
    guests: 2,
    href: "/hotels?destination=Goa"
  },
  {
    id: 3,
    type: "flight",
    from: "Bangalore",
    to: "Delhi",
    date: "10 Mar 2024",
    travelers: 1,
    href: "/flights?from=Bangalore&to=Delhi"
  },
  {
    id: 4,
    type: "hotel",
    destination: "Jaipur",
    checkIn: "25 Feb",
    checkOut: "28 Feb",
    guests: 4,
    href: "/hotels?destination=Jaipur"
  }
];

export const RecentSearches = () => {
  const [searches, setSearches] = useState(mockRecentSearches);

  const removeSearch = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSearches(searches.filter(s => s.id !== id));
  };

  if (searches.length === 0) return null;

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Your Recent Searches</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearches([])}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear All
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {searches.map((search, index) => (
            <motion.div
              key={search.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={search.href}>
                <div className="group relative bg-card rounded-xl border border-border/50 p-4 hover:border-primary/50 hover:shadow-md transition-all">
                  {/* Remove Button */}
                  <button
                    onClick={(e) => removeSearch(search.id, e)}
                    className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>

                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${search.type === 'flight' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                      {search.type === 'flight' ? (
                        <Plane className="w-5 h-5" />
                      ) : (
                        <Building2 className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {search.type === 'flight' ? (
                        <>
                          <div className="flex items-center gap-2 font-semibold">
                            <span>{search.from}</span>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            <span>{search.to}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {search.date} • {search.travelers} traveler{search.travelers > 1 ? 's' : ''}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1 font-semibold">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{search.destination}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {search.checkIn} - {search.checkOut} • {search.guests} guest{search.guests > 1 ? 's' : ''}
                          </p>
                        </>
                      )}
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
