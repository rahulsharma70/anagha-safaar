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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Search, Plus, Pencil, Trash2, RefreshCw, MapPin, Calendar } from "lucide-react";

interface TourData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location_city: string;
  location_state: string;
  duration_days: number;
  price_per_person: number;
  max_group_size: number | null;
  difficulty: string | null;
  tour_type: string | null;
  is_featured: boolean | null;
  itinerary: any;
  inclusions: any;
  exclusions: any;
  images: any;
  created_at: string;
}

interface TourFormData {
  name: string;
  slug: string;
  description: string;
  location_city: string;
  location_state: string;
  duration_days: number;
  price_per_person: number;
  max_group_size: number;
  difficulty: string;
  tour_type: string;
  is_featured: boolean;
}

export default function ToursManagement() {
  const [tours, setTours] = useState<TourData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<TourData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tourToDelete, setTourToDelete] = useState<TourData | null>(null);
  const [formData, setFormData] = useState<TourFormData>({
    name: "",
    slug: "",
    description: "",
    location_city: "",
    location_state: "",
    duration_days: 1,
    price_per_person: 0,
    max_group_size: 20,
    difficulty: "moderate",
    tour_type: "adventure",
    is_featured: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tours")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTours(data || []);
    } catch (error) {
      logger.error("Failed to fetch tours", error as Error);
      toast.error("Failed to load tours");
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
      duration_days: 1,
      price_per_person: 0,
      max_group_size: 20,
      difficulty: "moderate",
      tour_type: "adventure",
      is_featured: false,
    });
    setEditingTour(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (tour: TourData) => {
    setEditingTour(tour);
    setFormData({
      name: tour.name,
      slug: tour.slug,
      description: tour.description || "",
      location_city: tour.location_city,
      location_state: tour.location_state,
      duration_days: tour.duration_days,
      price_per_person: tour.price_per_person,
      max_group_size: tour.max_group_size || 20,
      difficulty: tour.difficulty || "moderate",
      tour_type: tour.tour_type || "adventure",
      is_featured: tour.is_featured || false,
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

      if (editingTour) {
        const { error } = await supabase
          .from("tours")
          .update({
            ...formData,
            slug,
          })
          .eq("id", editingTour.id);

        if (error) throw error;
        toast.success("Tour updated successfully");
      } else {
        const { error } = await supabase.from("tours").insert({
          ...formData,
          slug,
        });

        if (error) throw error;
        toast.success("Tour created successfully");
      }

      setDialogOpen(false);
      resetForm();
      await fetchTours();
    } catch (error) {
      logger.error("Failed to save tour", error as Error);
      toast.error("Failed to save tour");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!tourToDelete) return;

    try {
      const { error } = await supabase.from("tours").delete().eq("id", tourToDelete.id);

      if (error) throw error;
      toast.success("Tour deleted successfully");
      setDeleteDialogOpen(false);
      setTourToDelete(null);
      await fetchTours();
    } catch (error) {
      logger.error("Failed to delete tour", error as Error);
      toast.error("Failed to delete tour");
    }
  };

  const filteredTours = tours.filter(
    (tour) =>
      tour.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tour.location_city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDifficultyBadge = (difficulty: string | null) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      easy: "secondary",
      moderate: "default",
      challenging: "destructive",
    };
    return <Badge variant={variants[difficulty || "moderate"] || "secondary"}>{difficulty}</Badge>;
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
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Tours Management</h2>
          <p className="text-muted-foreground">Manage tour packages and experiences</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchTours} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tour
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
                placeholder="Search tours by name or city..."
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
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{tours.length}</div>
                <p className="text-sm text-muted-foreground">Total Tours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tours Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tours</CardTitle>
          <CardDescription>
            {filteredTours.length} of {tours.length} tours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tour</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTours.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No tours found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTours.map((tour) => (
                  <TableRow key={tour.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{tour.name}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {tour.tour_type}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {tour.location_city}, {tour.location_state}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {tour.duration_days} days
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(tour.price_per_person)}</TableCell>
                    <TableCell>{getDifficultyBadge(tour.difficulty)}</TableCell>
                    <TableCell>
                      {tour.is_featured ? (
                        <Badge>Featured</Badge>
                      ) : (
                        <Badge variant="outline">Standard</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(tour)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setTourToDelete(tour);
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
            <DialogTitle>{editingTour ? "Edit Tour" : "Add New Tour"}</DialogTitle>
            <DialogDescription>
              {editingTour ? "Update tour information" : "Add a new tour to the platform"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Tour Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter tour name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter tour description"
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
                  placeholder="e.g. Jaipur"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.location_state}
                  onChange={(e) => setFormData({ ...formData, location_state: e.target.value })}
                  placeholder="e.g. Rajasthan"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (Days) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration_days}
                  onChange={(e) =>
                    setFormData({ ...formData, duration_days: Number(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price per Person (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price_per_person}
                  onChange={(e) =>
                    setFormData({ ...formData, price_per_person: Number(e.target.value) })
                  }
                  placeholder="e.g. 15000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="group_size">Max Group Size</Label>
                <Input
                  id="group_size"
                  type="number"
                  value={formData.max_group_size}
                  onChange={(e) =>
                    setFormData({ ...formData, max_group_size: Number(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="challenging">Challenging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tour_type">Tour Type</Label>
                <Select
                  value={formData.tour_type}
                  onValueChange={(value) => setFormData({ ...formData, tour_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adventure">Adventure</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="wildlife">Wildlife</SelectItem>
                    <SelectItem value="spiritual">Spiritual</SelectItem>
                    <SelectItem value="beach">Beach</SelectItem>
                    <SelectItem value="heritage">Heritage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="featured">Featured Tour</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingTour ? "Update Tour" : "Add Tour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tour</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{tourToDelete?.name}"? This action cannot be undone.
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
