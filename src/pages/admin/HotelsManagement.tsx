import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Star,
  MapPin,
  Hotel,
} from "lucide-react";

interface HotelData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location_city: string;
  location_state: string;
  location_country: string | null;
  star_rating: number | null;
  price_per_night: number;
  available_rooms: number | null;
  is_featured: boolean | null;
  amenities: any;
  images: any;
  created_at: string;
}

interface HotelFormData {
  name: string;
  slug: string;
  description: string;
  location_city: string;
  location_state: string;
  location_country: string;
  star_rating: number;
  price_per_night: number;
  available_rooms: number;
  is_featured: boolean;
}

export default function HotelsManagement() {
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<HotelData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hotelToDelete, setHotelToDelete] = useState<HotelData | null>(null);
  const [formData, setFormData] = useState<HotelFormData>({
    name: "",
    slug: "",
    description: "",
    location_city: "",
    location_state: "",
    location_country: "India",
    star_rating: 4,
    price_per_night: 0,
    available_rooms: 0,
    is_featured: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hotels")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHotels(data || []);
    } catch (error) {
      logger.error("Failed to fetch hotels", error as Error);
      toast.error("Failed to load hotels");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      location_city: "",
      location_state: "",
      location_country: "India",
      star_rating: 4,
      price_per_night: 0,
      available_rooms: 0,
      is_featured: false,
    });
    setEditingHotel(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (hotel: HotelData) => {
    setEditingHotel(hotel);
    setFormData({
      name: hotel.name,
      slug: hotel.slug,
      description: hotel.description || "",
      location_city: hotel.location_city,
      location_state: hotel.location_state,
      location_country: hotel.location_country || "India",
      star_rating: hotel.star_rating || 4,
      price_per_night: hotel.price_per_night,
      available_rooms: hotel.available_rooms || 0,
      is_featured: hotel.is_featured || false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.location_city || !formData.location_state) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-");

      if (editingHotel) {
        const { error } = await supabase
          .from("hotels")
          .update({
            ...formData,
            slug,
          })
          .eq("id", editingHotel.id);

        if (error) throw error;
        toast.success("Hotel updated successfully");
      } else {
        const { error } = await supabase.from("hotels").insert({
          ...formData,
          slug,
        });

        if (error) throw error;
        toast.success("Hotel created successfully");
      }

      setDialogOpen(false);
      resetForm();
      await fetchHotels();
    } catch (error) {
      logger.error("Failed to save hotel", error as Error);
      toast.error("Failed to save hotel");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!hotelToDelete) return;

    try {
      const { error } = await supabase.from("hotels").delete().eq("id", hotelToDelete.id);

      if (error) throw error;
      toast.success("Hotel deleted successfully");
      setDeleteDialogOpen(false);
      setHotelToDelete(null);
      await fetchHotels();
    } catch (error) {
      logger.error("Failed to delete hotel", error as Error);
      toast.error("Failed to delete hotel");
    }
  };

  const filteredHotels = hotels.filter((hotel) =>
    hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hotel.location_city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
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
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Hotels Management</h2>
          <p className="text-muted-foreground">Manage hotel listings and availability</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchHotels} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Hotel
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
                placeholder="Search hotels by name or city..."
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
                <Hotel className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{hotels.length}</div>
                <p className="text-sm text-muted-foreground">Total Hotels</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hotels Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Hotels</CardTitle>
          <CardDescription>
            {filteredHotels.length} of {hotels.length} hotels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hotel</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Price/Night</TableHead>
                <TableHead>Rooms</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHotels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hotels found
                  </TableCell>
                </TableRow>
              ) : (
                filteredHotels.map((hotel) => (
                  <TableRow key={hotel.id}>
                    <TableCell className="font-medium">{hotel.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {hotel.location_city}, {hotel.location_state}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        {hotel.star_rating}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(hotel.price_per_night)}</TableCell>
                    <TableCell>{hotel.available_rooms}</TableCell>
                    <TableCell>
                      {hotel.is_featured ? (
                        <Badge>Featured</Badge>
                      ) : (
                        <Badge variant="outline">Standard</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(hotel)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setHotelToDelete(hotel);
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
            <DialogTitle>{editingHotel ? "Edit Hotel" : "Add New Hotel"}</DialogTitle>
            <DialogDescription>
              {editingHotel ? "Update hotel information" : "Add a new hotel to the platform"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Hotel Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter hotel name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter hotel description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.location_city}
                  onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                  placeholder="e.g. Mumbai"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.location_state}
                  onChange={(e) => setFormData({ ...formData, location_state: e.target.value })}
                  placeholder="e.g. Maharashtra"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price per Night (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price_per_night}
                  onChange={(e) =>
                    setFormData({ ...formData, price_per_night: Number(e.target.value) })
                  }
                  placeholder="e.g. 5000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rooms">Available Rooms</Label>
                <Input
                  id="rooms"
                  type="number"
                  value={formData.available_rooms}
                  onChange={(e) =>
                    setFormData({ ...formData, available_rooms: Number(e.target.value) })
                  }
                  placeholder="e.g. 50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="rating">Star Rating</Label>
                <Input
                  id="rating"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.star_rating}
                  onChange={(e) =>
                    setFormData({ ...formData, star_rating: Number(e.target.value) })
                  }
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="featured">Featured Hotel</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingHotel ? "Update Hotel" : "Add Hotel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Hotel</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{hotelToDelete?.name}"? This action cannot be undone.
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
