import { useState } from "react";
import { motion } from "framer-motion";
import { Filter, Clock, Plane, IndianRupee, Luggage, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface FlightFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  filters: FilterState;
}

export interface FilterState {
  stops: string[];
  airlines: string[];
  departureTime: string[];
  priceRange: [number, number];
  fareType: string[];
}

const airlines = [
  { id: "indigo", name: "IndiGo", logo: "🔵" },
  { id: "airindia", name: "Air India", logo: "🟠" },
  { id: "spicejet", name: "SpiceJet", logo: "🔴" },
  { id: "vistara", name: "Vistara", logo: "🟣" },
  { id: "goair", name: "Go First", logo: "🟢" },
  { id: "akasa", name: "Akasa Air", logo: "🟡" },
];

const departureSlots = [
  { id: "early", label: "Early Morning", time: "12AM - 6AM", icon: "🌙" },
  { id: "morning", label: "Morning", time: "6AM - 12PM", icon: "🌅" },
  { id: "afternoon", label: "Afternoon", time: "12PM - 6PM", icon: "☀️" },
  { id: "evening", label: "Evening", time: "6PM - 12AM", icon: "🌆" },
];

const fareTypes = [
  { id: "regular", label: "Regular Fare", description: "Cheapest fare with limited flexibility" },
  { id: "flexi", label: "Flexi Fare", description: "Free date change + extra baggage" },
  { id: "student", label: "Student Fare", description: "Extra baggage for students" },
  { id: "senior", label: "Senior Citizen", description: "Special discount for 60+ travelers" },
];

const FlightFilters = ({ onFilterChange, filters }: FlightFiltersProps) => {
  const [openSections, setOpenSections] = useState<string[]>(["stops", "airlines", "departure"]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  };

  const handleStopChange = (stop: string) => {
    const newStops = filters.stops.includes(stop)
      ? filters.stops.filter(s => s !== stop)
      : [...filters.stops, stop];
    onFilterChange({ ...filters, stops: newStops });
  };

  const handleAirlineChange = (airline: string) => {
    const newAirlines = filters.airlines.includes(airline)
      ? filters.airlines.filter(a => a !== airline)
      : [...filters.airlines, airline];
    onFilterChange({ ...filters, airlines: newAirlines });
  };

  const handleDepartureChange = (time: string) => {
    const newTimes = filters.departureTime.includes(time)
      ? filters.departureTime.filter(t => t !== time)
      : [...filters.departureTime, time];
    onFilterChange({ ...filters, departureTime: newTimes });
  };

  const handleFareChange = (fare: string) => {
    const newFares = filters.fareType.includes(fare)
      ? filters.fareType.filter(f => f !== fare)
      : [...filters.fareType, fare];
    onFilterChange({ ...filters, fareType: newFares });
  };

  const clearAllFilters = () => {
    onFilterChange({
      stops: [],
      airlines: [],
      departureTime: [],
      priceRange: [0, 50000],
      fareType: []
    });
  };

  const activeFilterCount = 
    filters.stops.length + 
    filters.airlines.length + 
    filters.departureTime.length + 
    filters.fareType.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 50000 ? 1 : 0);

  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30 bg-muted/30">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <span className="font-semibold">Filters</span>
          {activeFilterCount > 0 && (
            <Badge className="bg-primary text-primary-foreground text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="text-xs text-destructive hover:text-destructive"
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Stops Filter */}
        <Collapsible open={openSections.includes("stops")} onOpenChange={() => toggleSection("stops")}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
            <span className="font-medium text-sm flex items-center gap-2">
              <Plane className="w-4 h-4" /> Stops
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${openSections.includes("stops") ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-2">
            {["non-stop", "1-stop", "2+-stops"].map(stop => (
              <label key={stop} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox 
                  checked={filters.stops.includes(stop)}
                  onCheckedChange={() => handleStopChange(stop)}
                />
                <span className="text-sm capitalize">{stop.replace("-", " ")}</span>
              </label>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Airlines Filter */}
        <Collapsible open={openSections.includes("airlines")} onOpenChange={() => toggleSection("airlines")}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-t border-border/30 pt-4">
            <span className="font-medium text-sm">Airlines</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${openSections.includes("airlines") ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-2">
            {airlines.map(airline => (
              <label key={airline.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox 
                  checked={filters.airlines.includes(airline.id)}
                  onCheckedChange={() => handleAirlineChange(airline.id)}
                />
                <span className="text-lg">{airline.logo}</span>
                <span className="text-sm">{airline.name}</span>
              </label>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Departure Time Filter */}
        <Collapsible open={openSections.includes("departure")} onOpenChange={() => toggleSection("departure")}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-t border-border/30 pt-4">
            <span className="font-medium text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" /> Departure Time
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${openSections.includes("departure") ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="grid grid-cols-2 gap-2">
              {departureSlots.map(slot => (
                <button
                  key={slot.id}
                  onClick={() => handleDepartureChange(slot.id)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    filters.departureTime.includes(slot.id)
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:border-primary/50"
                  }`}
                >
                  <span className="text-lg block">{slot.icon}</span>
                  <span className="text-xs font-medium block mt-1">{slot.label}</span>
                  <span className="text-xs text-muted-foreground">{slot.time}</span>
                </button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Price Range Filter */}
        <div className="border-t border-border/30 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-sm flex items-center gap-2">
              <IndianRupee className="w-4 h-4" /> Price Range
            </span>
          </div>
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => onFilterChange({ ...filters, priceRange: value as [number, number] })}
            max={50000}
            min={0}
            step={500}
            className="mt-2"
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>₹{filters.priceRange[0].toLocaleString()}</span>
            <span>₹{filters.priceRange[1].toLocaleString()}</span>
          </div>
        </div>

        {/* Fare Type Filter */}
        <Collapsible open={openSections.includes("fare")} onOpenChange={() => toggleSection("fare")}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-t border-border/30 pt-4">
            <span className="font-medium text-sm flex items-center gap-2">
              <Luggage className="w-4 h-4" /> Fare Type
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${openSections.includes("fare") ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-2">
            {fareTypes.map(fare => (
              <label key={fare.id} className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox 
                  checked={filters.fareType.includes(fare.id)}
                  onCheckedChange={() => handleFareChange(fare.id)}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium block">{fare.label}</span>
                  <span className="text-xs text-muted-foreground">{fare.description}</span>
                </div>
              </label>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default FlightFilters;
