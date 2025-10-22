import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const FlightsManagement = () => {
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    try {
      const { data, error } = await supabase
        .from("flights")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFlights(data || []);
    } catch (error) {
      console.error("Error fetching flights:", error);
      toast.error("Failed to load flights");
    } finally {
      setLoading(false);
    }
  };

  const deleteFlight = async (flightId: string) => {
    try {
      const { error } = await supabase
        .from("flights")
        .delete()
        .eq("id", flightId);

      if (error) throw error;
      
      toast.success("Flight deleted successfully");
      fetchFlights();
    } catch (error) {
      console.error("Error deleting flight:", error);
      toast.error("Failed to delete flight");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading flights...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Manage flight listings</p>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Flight
        </Button>
      </div>

      <div className="grid gap-4">
        {flights.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No flights found
            </CardContent>
          </Card>
        ) : (
          flights.map((flight) => (
            <Card key={flight.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{flight.airline} - {flight.flight_number}</h3>
                      {flight.is_featured && <Badge>Featured</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {flight.departure_city} → {flight.arrival_city}
                    </p>
                    <div className="flex gap-4 text-sm">
                      <span>{new Date(flight.departure_time).toLocaleString()}</span>
                      <span>Economy: ₹{Number(flight.price_economy).toLocaleString()}</span>
                      {flight.price_business && (
                        <span>Business: ₹{Number(flight.price_business).toLocaleString()}</span>
                      )}
                      <span>{flight.available_seats} seats</span>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Flight</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete flight {flight.flight_number}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteFlight(flight.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
