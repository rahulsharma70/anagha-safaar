import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Star, Plus, Edit2, Trash2, Hotel, Plane, Camera, ThumbsUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Review {
  user_id: string;
  id: string;
  item_id: string;
  item_type: string;
  rating: number;
  title?: string;
  comment?: string;
  created_at: string;
  updated_at: string;
}

interface ReviewItemDetails {
  name: string;
  image?: string;
}

export const UserReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [itemDetails, setItemDetails] = useState<Record<string, ReviewItemDetails>>({});
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editTitle, setEditTitle] = useState('');
  const [editComment, setEditComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReviews();
    }
  }, [user]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);

      // Fetch item details for each review
      const details: Record<string, ReviewItemDetails> = {};
      for (const review of data || []) {
        const itemDetail = await fetchItemDetails(review.item_type, review.item_id);
        if (itemDetail) {
          details[review.item_id] = itemDetail;
        }
      }
      setItemDetails(details);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItemDetails = async (type: string, id: string): Promise<ReviewItemDetails | null> => {
    try {
      let data;
      if (type === 'hotel') {
        const { data: hotel } = await supabase.from('hotels').select('name, images').eq('id', id).single();
        data = hotel;
      } else if (type === 'tour') {
        const { data: tour } = await supabase.from('tours').select('name, images').eq('id', id).single();
        data = tour;
      } else if (type === 'flight') {
        const { data: flight } = await supabase.from('flights').select('airline, flight_number, departure_city, arrival_city').eq('id', id).single();
        if (flight) {
          return { name: `${flight.airline} ${flight.flight_number} (${flight.departure_city} → ${flight.arrival_city})` };
        }
      }
      
      if (data) {
        return { 
          name: data.name || 'Unknown',
          image: Array.isArray(data.images) && data.images.length > 0 ? data.images[0] : undefined
        };
      }
      return null;
    } catch {
      return null;
    }
  };

  const openEditDialog = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditTitle(review.title || '');
    setEditComment(review.comment || '');
  };

  const saveReview = async () => {
    if (!editingReview || editRating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          rating: editRating,
          title: editTitle || null,
          comment: editComment || null,
        })
        .eq('id', editingReview.id);

      if (error) throw error;

      toast.success('Review updated successfully!');
      setEditingReview(null);
      fetchReviews();
    } catch (error) {
      toast.error('Failed to update review');
    } finally {
      setSaving(false);
    }
  };

  const deleteReview = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Review deleted');
      fetchReviews();
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'hotel': return <Hotel className="h-5 w-5" />;
      case 'flight': return <Plane className="h-5 w-5" />;
      case 'tour': return <Camera className="h-5 w-5" />;
      default: return <ThumbsUp className="h-5 w-5" />;
    }
  };

  const StarRating = ({ rating, onChange, readonly = false }: { rating: number; onChange?: (r: number) => void; readonly?: boolean }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 ${star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'} ${!readonly ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onClick={() => !readonly && onChange?.(star)}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Star className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
            <p className="text-muted-foreground mb-4">
              Share your travel experiences to help other travelers!
            </p>
            <p className="text-sm text-muted-foreground">
              Complete a booking to leave a review and earn 50 loyalty points per review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Your Reviews ({reviews.length})</h3>
          </div>

          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {itemDetails[review.item_id]?.image ? (
                      <img 
                        src={itemDetails[review.item_id].image} 
                        alt="" 
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                        {getItemIcon(review.item_type)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="capitalize">{review.item_type}</Badge>
                          <StarRating rating={review.rating} readonly />
                        </div>
                        <h4 className="font-medium">
                          {itemDetails[review.item_id]?.name || 'Loading...'}
                        </h4>
                        {review.title && (
                          <p className="font-medium mt-2">{review.title}</p>
                        )}
                        {review.comment && (
                          <p className="text-muted-foreground mt-1">{review.comment}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Reviewed on {format(new Date(review.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(review)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteReview(review.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Review Dialog */}
      <Dialog open={!!editingReview} onOpenChange={() => setEditingReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
            <DialogDescription>
              Update your review for {itemDetails[editingReview?.item_id || '']?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rating</label>
              <StarRating rating={editRating} onChange={setEditRating} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Title (optional)</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Summarize your experience"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Review (optional)</label>
              <Textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                placeholder="Share your experience..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReview(null)}>Cancel</Button>
            <Button onClick={saveReview} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
