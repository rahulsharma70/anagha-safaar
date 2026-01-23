import { ArrowUpDown, Clock, IndianRupee, Plane, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FlightSortBarProps {
  sortBy: string;
  onSortChange: (sort: string) => void;
  totalFlights: number;
}

const sortOptions = [
  { id: "popular", label: "Popular", icon: Star },
  { id: "price-low", label: "Price - Low to High", icon: IndianRupee },
  { id: "price-high", label: "Price - High to Low", icon: IndianRupee },
  { id: "duration", label: "Duration - Shortest", icon: Clock },
  { id: "departure", label: "Departure - Earliest", icon: Plane },
];

const FlightSortBar = ({ sortBy, onSortChange, totalFlights }: FlightSortBarProps) => {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Sort by:</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {sortOptions.map((option) => (
            <Button
              key={option.id}
              variant="ghost"
              size="sm"
              onClick={() => onSortChange(option.id)}
              className={cn(
                "rounded-full text-sm h-9 px-4 transition-all",
                sortBy === option.id 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "bg-muted/50 hover:bg-muted"
              )}
            >
              <option.icon className="w-3.5 h-3.5 mr-1.5" />
              {option.label}
            </Button>
          ))}
        </div>

        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{totalFlights}</span> flights found
        </div>
      </div>
    </div>
  );
};

export default FlightSortBar;
