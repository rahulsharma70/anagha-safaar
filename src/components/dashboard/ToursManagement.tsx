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

export const ToursManagement = () => {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    try {
      const { data, error } = await supabase
        .from("tours")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTours(data || []);
    } catch (error) {
      console.error("Error fetching tours:", error);
      toast.error("Failed to load tours");
    } finally {
      setLoading(false);
    }
  };

  const deleteTour = async (tourId: string) => {
    try {
      const { error } = await supabase
        .from("tours")
        .delete()
        .eq("id", tourId);

      if (error) throw error;
      
      toast.success("Tour deleted successfully");
      fetchTours();
    } catch (error) {
      console.error("Error deleting tour:", error);
      toast.error("Failed to delete tour");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading tours...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">Manage tour packages</p>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Tour
        </Button>
      </div>

      <div className="grid gap-4">
        {tours.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No tours found
            </CardContent>
          </Card>
        ) : (
          tours.map((tour) => (
            <Card key={tour.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{tour.name}</h3>
                      {tour.is_featured && <Badge>Featured</Badge>}
                      {tour.difficulty && <Badge variant="outline">{tour.difficulty}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {tour.location_city}, {tour.location_state}
                    </p>
                    <div className="flex gap-4 text-sm">
                      <span>{tour.duration_days} days</span>
                      <span>₹{Number(tour.price_per_person).toLocaleString()}/person</span>
                      <span>Max {tour.max_group_size} guests</span>
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
                        <AlertDialogTitle>Delete Tour</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {tour.name}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteTour(tour.id)}>
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
