import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface BookingFormProps {
  itemId: string;
  itemType: "hotel" | "tour";
  pricePerUnit: number;
  maxGuests?: number;
  requiresEndDate?: boolean;
}

const BookingForm = ({ itemId, itemType, pricePerUnit, maxGuests = 20, requiresEndDate = false }: BookingFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);

  const calculateTotal = () => {
    if (requiresEndDate && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return nights * pricePerUnit * guests;
    }
    return pricePerUnit * guests;
  };

  const handleBooking = async () => {
    if (!user) {
      toast.error("Please sign in to book");
      navigate("/auth");
      return;
    }

    if (!startDate || (requiresEndDate && !endDate)) {
      toast.error("Please select all required dates");
      return;
    }

    setLoading(true);
    try {
      const bookingReference = `${itemType.toUpperCase().slice(0, 2)}${Date.now().toString().slice(-8)}`;
      
      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        item_id: itemId,
        item_type: itemType,
        booking_reference: bookingReference,
        start_date: startDate,
        end_date: requiresEndDate ? endDate : null,
        guests_count: guests,
        total_amount: calculateTotal(),
        status: "confirmed",
        payment_status: "pending",
      });

      if (error) throw error;

      toast.success("Booking confirmed successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle>Book Now</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">
            <Calendar className="h-4 w-4 inline mr-2" />
            {requiresEndDate ? "Check-in" : "Start Date"}
          </Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

        {requiresEndDate && (
          <div className="space-y-2">
            <Label htmlFor="endDate">
              <Calendar className="h-4 w-4 inline mr-2" />
              Check-out
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || new Date().toISOString().split("T")[0]}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="guests">
            <Users className="h-4 w-4 inline mr-2" />
            {itemType === "hotel" ? "Guests" : "Travelers"}
          </Label>
          <Input
            id="guests"
            type="number"
            min="1"
            max={maxGuests}
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
          />
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Price per {requiresEndDate ? "night" : "person"}:</span>
            <span>₹{pricePerUnit.toLocaleString()}</span>
          </div>
          {requiresEndDate && startDate && endDate && (
            <div className="flex justify-between text-sm">
              <span>Nights:</span>
              <span>
                {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span>{itemType === "hotel" ? "Guests" : "Travelers"}:</span>
            <span>{guests}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total:</span>
            <span className="text-accent">₹{calculateTotal().toLocaleString()}</span>
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={handleBooking} disabled={loading}>
          <DollarSign className="h-4 w-4 mr-2" />
          {loading ? "Processing..." : "Confirm Booking"}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Free cancellation • No booking fees
        </p>
      </CardContent>
    </Card>
  );
};

export default BookingForm;
