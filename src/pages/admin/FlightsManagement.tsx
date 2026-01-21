import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { Search, Plus, Pencil, Trash2, RefreshCw, Plane, Clock } from "lucide-react";

interface FlightData {
  id: string;
  airline: string;
  flight_number: string;
  departure_city: string;
  arrival_city: string;
  departure_time: string;
  arrival_time: string;
  price_economy: number | null;
  price_business: number | null;
  available_seats: number | null;
  is_featured: boolean | null;
  created_at: string;
}

interface FlightFormData {
  airline: string;
  flight_number: string;
  departure_city: string;
  arrival_city: string;
  departure_time: string;
  arrival_time: string;
  price_economy: number;
  price_business: number;
  available_seats: number;
  is_featured: boolean;
}

export default function FlightsManagement() {
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState<FlightData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flightToDelete, setFlightToDelete] = useState<FlightData | null>(null);
  const [formData, setFormData] = useState<FlightFormData>({
    airline: "",
    flight_number: "",
    departure_city: "",
    arrival_city: "",
    departure_time: "",
    arrival_time: "",
    price_economy: 0,
    price_business: 0,
    available_seats: 0,
    is_featured: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("flights")
        .select("*")
        .order("departure_time", { ascending: true });

      if (error) throw error;
      setFlights(data || []);
    } catch (error) {
      logger.error("Failed to fetch flights", error as Error);
      toast.error("Failed to load flights");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      airline: "",
      flight_number: "",
      departure_city: "",
      arrival_city: "",
      departure_time: "",
      arrival_time: "",
      price_economy: 0,
      price_business: 0,
      available_seats: 0,
      is_featured: false,
    });
    setEditingFlight(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (flight: FlightData) => {
    setEditingFlight(flight);
    setFormData({
      airline: flight.airline,
      flight_number: flight.flight_number,
      departure_city: flight.departure_city,
      arrival_city: flight.arrival_city,
      departure_time: flight.departure_time.slice(0, 16),
      arrival_time: flight.arrival_time.slice(0, 16),
      price_economy: flight.price_economy || 0,
      price_business: flight.price_business || 0,
      available_seats: flight.available_seats || 0,
      is_featured: flight.is_featured || false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (
      !formData.airline ||
      !formData.flight_number ||
      !formData.departure_city ||
      !formData.arrival_city
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      if (editingFlight) {
        const { error } = await supabase
          .from("flights")
          .update(formData)
          .eq("id", editingFlight.id);

        if (error) throw error;
        toast.success("Flight updated successfully");
      } else {
        const { error } = await supabase.from("flights").insert(formData);

        if (error) throw error;
        toast.success("Flight created successfully");
      }

      setDialogOpen(false);
      resetForm();
      await fetchFlights();
    } catch (error) {
      logger.error("Failed to save flight", error as Error);
      toast.error("Failed to save flight");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!flightToDelete) return;

    try {
      const { error } = await supabase.from("flights").delete().eq("id", flightToDelete.id);

      if (error) throw error;
      toast.success("Flight deleted successfully");
      setDeleteDialogOpen(false);
      setFlightToDelete(null);
      await fetchFlights();
    } catch (error) {
      logger.error("Failed to delete flight", error as Error);
      toast.error("Failed to delete flight");
    }
  };

  const filteredFlights = flights.filter(
    (flight) =>
      flight.airline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flight.flight_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flight.departure_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flight.arrival_city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Flights Management</h2>
          <p className="text-muted-foreground">Manage flight schedules and pricing</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchFlights} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Flight
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by airline, flight number, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Plane className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{flights.length}</div>
                <p className="text-sm text-muted-foreground">Total Flights</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flights Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Flights</CardTitle>
          <CardDescription>
            {filteredFlights.length} of {flights.length} flights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flight</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Economy</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFlights.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No flights found
                  </TableCell>
                </TableRow>
              ) : (
                filteredFlights.map((flight) => (
                  <TableRow key={flight.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{flight.airline}</div>
                        <div className="text-sm text-muted-foreground">{flight.flight_number}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{flight.departure_city}</span>
                        <Plane className="h-3 w-3 text-muted-foreground" />
                        <span>{flight.arrival_city}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(flight.departure_time)}
                        </div>
                        <div className="text-muted-foreground">
                          to {formatDateTime(flight.arrival_time)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(flight.price_economy || 0)}</TableCell>
                    <TableCell>{formatCurrency(flight.price_business || 0)}</TableCell>
                    <TableCell>{flight.available_seats}</TableCell>
                    <TableCell>
                      {flight.is_featured ? (
                        <Badge>Featured</Badge>
                      ) : (
                        <Badge variant="outline">Standard</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(flight)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setFlightToDelete(flight);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFlight ? "Edit Flight" : "Add New Flight"}</DialogTitle>
            <DialogDescription>
              {editingFlight ? "Update flight information" : "Add a new flight to the platform"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="airline">Airline *</Label>
                <Input
                  id="airline"
                  value={formData.airline}
                  onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
                  placeholder="e.g. Air India"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="flight_number">Flight Number *</Label>
                <Input
                  id="flight_number"
                  value={formData.flight_number}
                  onChange={(e) => setFormData({ ...formData, flight_number: e.target.value })}
                  placeholder="e.g. AI-101"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="departure_city">Departure City *</Label>
                <Input
                  id="departure_city"
                  value={formData.departure_city}
                  onChange={(e) => setFormData({ ...formData, departure_city: e.target.value })}
                  placeholder="e.g. Mumbai"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="arrival_city">Arrival City *</Label>
                <Input
                  id="arrival_city"
                  value={formData.arrival_city}
                  onChange={(e) => setFormData({ ...formData, arrival_city: e.target.value })}
                  placeholder="e.g. Delhi"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="departure_time">Departure Time *</Label>
                <Input
                  id="departure_time"
                  type="datetime-local"
                  value={formData.departure_time}
                  onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="arrival_time">Arrival Time *</Label>
                <Input
                  id="arrival_time"
                  type="datetime-local"
                  value={formData.arrival_time}
                  onChange={(e) => setFormData({ ...formData, arrival_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price_economy">Economy Price (₹)</Label>
                <Input
                  id="price_economy"
                  type="number"
                  value={formData.price_economy}
                  onChange={(e) =>
                    setFormData({ ...formData, price_economy: Number(e.target.value) })
                  }
                  placeholder="e.g. 5000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price_business">Business Price (₹)</Label>
                <Input
                  id="price_business"
                  type="number"
                  value={formData.price_business}
                  onChange={(e) =>
                    setFormData({ ...formData, price_business: Number(e.target.value) })
                  }
                  placeholder="e.g. 15000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="seats">Available Seats</Label>
                <Input
                  id="seats"
                  type="number"
                  value={formData.available_seats}
                  onChange={(e) =>
                    setFormData({ ...formData, available_seats: Number(e.target.value) })
                  }
                  placeholder="e.g. 180"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="featured">Featured Flight</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingFlight ? "Update Flight" : "Add Flight"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Flight</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete flight {flightToDelete?.flight_number}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
