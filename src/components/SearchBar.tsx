import { useState } from "react";
import { Search, MapPin, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

const SearchBar = () => {
  const [searchType, setSearchType] = useState<"hotels" | "tours" | "flights">("hotels");
  const [destination, setDestination] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    navigate(`/${searchType}?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-up">
      {/* Search Type Tabs */}
      <div className="flex space-x-2 mb-4 mt-4">
        <button
          onClick={() => setSearchType("hotels")}
          className={`px-6 py-2 rounded-lg font-medium transition-smooth ${
            searchType === "hotels"
              ? "bg-accent text-accent-foreground shadow-gold"
              : "bg-card text-card-foreground hover:bg-muted"
          }`}
        >
          Hotels
        </button>
        <button
          onClick={() => setSearchType("tours")}
          className={`px-6 py-2 rounded-lg font-medium transition-smooth ${
            searchType === "tours"
              ? "bg-accent text-accent-foreground shadow-gold"
              : "bg-card text-card-foreground hover:bg-muted"
          }`}
        >
          Tours
        </button>
        <button
          onClick={() => setSearchType("flights")}
          className={`px-6 py-2 rounded-lg font-medium transition-smooth ${
            searchType === "flights"
              ? "bg-accent text-accent-foreground shadow-gold"
              : "bg-card text-card-foreground hover:bg-muted"
          }`}
        >
          Flights
        </button>
      </div>

      {/* Search Form */}
      <div className="bg-card rounded-2xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Destination */}
          <div className="space-y-2">
            <Label htmlFor="destination" className="text-sm font-medium">
              Destination
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="destination"
                placeholder="Where to?"
                className="pl-10"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
          </div>

          {/* Check-in */}
          <div className="space-y-2">
            <Label htmlFor="checkin" className="text-sm font-medium">
              Check-in
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="checkin" type="date" className="pl-10" />
            </div>
          </div>

          {/* Check-out */}
          <div className="space-y-2">
            <Label htmlFor="checkout" className="text-sm font-medium">
              Check-out
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="checkout" type="date" className="pl-10" />
            </div>
          </div>

          {/* Guests */}
          <div className="space-y-2">
            <Label htmlFor="guests" className="text-sm font-medium">
              Guests
            </Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="guests" type="number" placeholder="2 guests" min="1" className="pl-10" />
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div className="mt-6">
          <Button variant="hero" size="lg" className="w-full md:w-auto md:min-w-[200px]" onClick={handleSearch}>
            <Search className="h-5 w-5" />
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
