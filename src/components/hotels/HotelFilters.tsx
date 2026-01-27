import { useState } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  SlidersHorizontal, 
  Star, 
  Wifi, 
  Car, 
  Utensils, 
  Dumbbell, 
  Waves, 
  Wine,
  Coffee,
  Tv,
  AirVent,
  X
} from "lucide-react";

interface HotelFiltersProps {
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  starRating: number[];
  onStarChange: (stars: number[]) => void;
  amenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
  onClearFilters: () => void;
}

const amenityOptions = [
  { id: "wifi", label: "Free WiFi", icon: Wifi },
  { id: "parking", label: "Free Parking", icon: Car },
  { id: "restaurant", label: "Restaurant", icon: Utensils },
  { id: "gym", label: "Fitness Center", icon: Dumbbell },
  { id: "pool", label: "Swimming Pool", icon: Waves },
  { id: "bar", label: "Bar/Lounge", icon: Wine },
  { id: "breakfast", label: "Breakfast", icon: Coffee },
  { id: "tv", label: "Flat-screen TV", icon: Tv },
  { id: "ac", label: "Air Conditioning", icon: AirVent },
];

const HotelFilters = ({
  priceRange,
  onPriceChange,
  starRating,
  onStarChange,
  amenities,
  onAmenitiesChange,
  onClearFilters,
}: HotelFiltersProps) => {
  const activeFiltersCount = 
    (priceRange[0] > 0 || priceRange[1] < 50000 ? 1 : 0) + 
    starRating.length + 
    amenities.length;

  const toggleStar = (star: number) => {
    if (starRating.includes(star)) {
      onStarChange(starRating.filter(s => s !== star));
    } else {
      onStarChange([...starRating, star]);
    }
  };

  const toggleAmenity = (amenity: string) => {
    if (amenities.includes(amenity)) {
      onAmenitiesChange(amenities.filter(a => a !== amenity));
    } else {
      onAmenitiesChange([...amenities, amenity]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-card rounded-2xl border border-border/50 p-6 sticky top-24"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Filters</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Price Range */}
      <div className="mb-8">
        <h4 className="font-medium mb-4">Price per night</h4>
        <Slider
          value={priceRange}
          onValueChange={(value) => onPriceChange(value as [number, number])}
          max={50000}
          min={0}
          step={500}
          className="mb-3"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>₹{priceRange[0].toLocaleString()}</span>
          <span>₹{priceRange[1].toLocaleString()}</span>
        </div>
      </div>

      {/* Star Rating */}
      <div className="mb-8">
        <h4 className="font-medium mb-4">Star Rating</h4>
        <div className="flex flex-wrap gap-2">
          {[5, 4, 3, 2].map((star) => (
            <Button
              key={star}
              variant={starRating.includes(star) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleStar(star)}
              className="rounded-full"
            >
              {star} <Star className="w-3 h-3 ml-1 fill-current" />
            </Button>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div className="mb-6">
        <h4 className="font-medium mb-4">Amenities</h4>
        <div className="space-y-3">
          {amenityOptions.map((amenity) => (
            <label
              key={amenity.id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <Checkbox
                checked={amenities.includes(amenity.id)}
                onCheckedChange={() => toggleAmenity(amenity.id)}
              />
              <amenity.icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-sm group-hover:text-foreground transition-colors">
                {amenity.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Popular Filters Quick Access */}
      <div className="pt-4 border-t border-border/50">
        <h4 className="font-medium mb-3 text-sm text-muted-foreground">Popular</h4>
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => {
              onStarChange([5, 4]);
              onAmenitiesChange(["wifi", "pool"]);
            }}
          >
            Luxury Stay
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => {
              onPriceChange([0, 5000]);
            }}
          >
            Budget Friendly
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => {
              onAmenitiesChange(["breakfast", "wifi"]);
            }}
          >
            With Breakfast
          </Badge>
        </div>
      </div>
    </motion.div>
  );
};

export default HotelFilters;
