import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

// Indian cities for autocomplete
const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad",
  "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam",
  "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut",
  "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Allahabad",
  "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur",
  "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh", "Solapur", "Hubli", "Mysore",
  "Tiruchirappalli", "Bareilly", "Aligarh", "Moradabad", "Gorakhpur", "Bikaner", "Amravati",
  "Noida", "Jamshedpur", "Bhilai", "Warangal", "Cuttack", "Firozabad", "Kochi", "Nellore",
  "Bhavnagar", "Dehradun", "Durgapur", "Asansol", "Rourkela", "Nanded", "Kolhapur",
  "Ajmer", "Akola", "Gulbarga", "Jamnagar", "Ujjain", "Loni", "Siliguri", "Jhansi",
  "Ulhasnagar", "Jammu", "Sangli", "Mangalore", "Erode", "Belgaum", "Ambattur", "Tirunelveli",
  "Malegaon", "Gaya", "Jalgaon", "Udaipur", "Maheshtala", "Davanagere", "Kozhikode", "Kurnool",
  "Goa", "Shimla", "Manali", "Rishikesh", "Darjeeling", "Ooty", "Mussoorie", "Munnar",
  "Leh", "Ladakh", "Andaman", "Pondicherry", "Hampi", "Khajuraho", "Bodh Gaya",
  "Pushkar", "Jaisalmer", "Ranthambore", "Jim Corbett", "Kaziranga", "Kerala", "Gokarna",
  "Alleppey", "Kumarakom", "Thekkady", "Wayanad", "Coorg", "Chikmagalur", "Lonavala",
  "Mahabaleshwar", "Panchgani", "Lavasa", "Shirdi", "Tirupati", "Rameshwaram", "Kanyakumari",
  "Madikeri", "Hampi", "Badami", "Aihole", "Pattadakal", "Bijapur", "Hospet",
  "Himalayas", "Rajasthan", "Uttarakhand", "Sikkim", "Meghalaya", "Arunachal Pradesh"
];

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  iconColor?: string;
}

export const CityAutocomplete = ({
  value,
  onChange,
  placeholder = "Enter city",
  className,
  icon,
  iconColor = "text-muted-foreground"
}: CityAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length >= 1) {
      const filtered = INDIAN_CITIES.filter(city =>
        city.toLowerCase().startsWith(value.toLowerCase())
      ).slice(0, 8);
      setSuggestions(filtered);
      setIsOpen(filtered.length > 0 && document.activeElement === inputRef.current);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (city: string) => {
    onChange(city);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Enter" && suggestions.length > 0) {
      e.preventDefault();
      handleSelect(suggestions[0]);
    }
  };

  return (
    <div className="relative">
      {icon || <MapPin className={cn("absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5", iconColor)} />}
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className={cn("pl-12 h-14 text-lg rounded-xl border-border/50 bg-background/50", className)}
        autoComplete="off"
      />
      
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
        >
          {suggestions.map((city, index) => (
            <button
              key={city}
              type="button"
              onClick={() => handleSelect(city)}
              className={cn(
                "w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-3",
                index === 0 && "bg-muted/30"
              )}
            >
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{city}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CityAutocomplete;
