import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Star, 
  MapPin, 
  Heart, 
  Wifi, 
  Car, 
  Utensils, 
  Waves,
  Users,
  ThumbsUp,
  Sparkles,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface HotelCardEnhancedProps {
  id: string;
  slug: string;
  name: string;
  location: string;
  image: string;
  price: number;
  originalPrice?: number;
  starRating: number;
  userRating: number;
  reviewCount: number;
  amenities?: string[];
  availableRooms?: number;
  isFeatured?: boolean;
  discount?: number;
}

const amenityIcons: Record<string, React.ElementType> = {
  wifi: Wifi,
  parking: Car,
  restaurant: Utensils,
  pool: Waves,
};

const HotelCardEnhanced = ({
  id,
  slug,
  name,
  location,
  image,
  price,
  originalPrice,
  starRating,
  userRating,
  reviewCount,
  amenities = ["wifi", "parking", "restaurant"],
  availableRooms,
  isFeatured,
  discount,
}: HotelCardEnhancedProps) => {
  const [isWishlisted, setIsWishlisted] = useState(false);

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return "Excellent";
    if (rating >= 4.0) return "Very Good";
    if (rating >= 3.5) return "Good";
    return "Pleasant";
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {isFeatured && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
              <Sparkles className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}
          {discount && discount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground">
              {discount}% OFF
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsWishlisted(!isWishlisted);
          }}
          className={cn(
            "absolute top-3 right-3 p-2 rounded-full transition-all",
            isWishlisted 
              ? "bg-destructive text-white" 
              : "bg-black/30 backdrop-blur-sm text-white hover:bg-black/50"
          )}
        >
          <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
        </button>

        {/* Low Availability Badge */}
        {availableRooms && availableRooms < 5 && (
          <div className="absolute bottom-3 left-3 right-3">
            <Badge variant="destructive" className="w-full justify-center py-1.5">
              <Clock className="w-3 h-3 mr-1" />
              Only {availableRooms} rooms left!
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Star Rating */}
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: starRating }).map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
          ))}
          <span className="text-xs text-muted-foreground ml-1">
            {starRating} Star Hotel
          </span>
        </div>

        {/* Hotel Name */}
        <Link to={`/hotels/${slug}`}>
          <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
            {name}
          </h3>
        </Link>

        {/* Location */}
        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
          <MapPin className="w-4 h-4" />
          <span className="line-clamp-1">{location}</span>
        </div>

        {/* Amenities */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50">
          {amenities.slice(0, 4).map((amenity) => {
            const Icon = amenityIcons[amenity] || Wifi;
            return (
              <div
                key={amenity}
                className="p-2 rounded-lg bg-muted/50 text-muted-foreground"
                title={amenity}
              >
                <Icon className="w-4 h-4" />
              </div>
            );
          })}
          {amenities.length > 4 && (
            <span className="text-xs text-muted-foreground">
              +{amenities.length - 4} more
            </span>
          )}
        </div>

        {/* Rating & Reviews */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">
              <ThumbsUp className="w-3 h-3" />
              {userRating.toFixed(1)}
            </div>
            <div className="text-sm">
              <span className="font-medium">{getRatingLabel(userRating)}</span>
              <span className="text-muted-foreground ml-1">
                ({reviewCount.toLocaleString()} reviews)
              </span>
            </div>
          </div>
        </div>

        {/* Price & Book */}
        <div className="flex items-end justify-between">
          <div>
            {originalPrice && originalPrice > price && (
              <span className="text-sm text-muted-foreground line-through">
                ₹{originalPrice.toLocaleString()}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-primary">
                ₹{price.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">/night</span>
            </div>
            <span className="text-xs text-muted-foreground">
              + taxes & fees
            </span>
          </div>
          <Link to={`/hotels/${slug}`}>
            <Button className="rounded-xl">
              View Details
            </Button>
          </Link>
        </div>

        {/* Social Proof */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {Math.floor(Math.random() * 50) + 10} people booked in last 24 hours
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default HotelCardEnhanced;
