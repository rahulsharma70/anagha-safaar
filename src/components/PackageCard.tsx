import { Star, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PackageCardProps {
  image: string;
  title: string;
  location: string;
  duration: string;
  rating: number;
  reviews: number;
  price: number;
  badge?: string;
  href?: string;
  onClick?: () => void;
}

const PackageCard = ({
  image,
  title,
  location,
  duration,
  rating,
  reviews,
  price,
  badge,
  href,
  onClick,
}: PackageCardProps) => {
  return (
    <div className="group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-smooth cursor-pointer">
      {/* Image */}
      <div className="relative overflow-hidden h-64">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-smooth duration-500"
        />
        {badge && (
          <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground shadow-gold">
            {badge}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <h3 className="text-xl font-semibold text-card-foreground group-hover:text-accent transition-smooth">
          {title}
        </h3>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <MapPin className="h-4 w-4" />
            <span>{location}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{duration}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="font-semibold text-card-foreground">{rating}</span>
          </div>
          <span className="text-sm text-muted-foreground">({reviews} reviews)</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <span className="text-sm text-muted-foreground">From</span>
            <p className="text-2xl font-bold text-accent">₹{price.toLocaleString()}</p>
          </div>
          <Button variant="ocean" size="sm" onClick={onClick} asChild={!!href}>
            {href ? <a href={href}>View Details</a> : "View Details"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PackageCard;
