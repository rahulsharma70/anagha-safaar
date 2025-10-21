import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface ReviewSectionProps {
  itemId: string;
  itemType: "hotel" | "tour" | "flight";
}

const ReviewSection = ({ itemId, itemType }: ReviewSectionProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [itemId]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select(`
        *,
        profiles (full_name, email)
      `)
      .eq("item_id", itemId)
      .eq("item_type", itemType)
      .order("created_at", { ascending: false });

    if (data) setReviews(data);
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error("Please sign in to leave a review");
      return;
    }

    if (!newReview.comment.trim()) {
      toast.error("Please write a comment");
      return;
    }

    try {
      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        item_id: itemId,
        item_type: itemType,
        rating: newReview.rating,
        comment: newReview.comment,
      });

      if (error) throw error;

      toast.success("Review submitted successfully!");
      setNewReview({ rating: 5, comment: "" });
      setShowForm(false);
      fetchReviews();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
    }
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating ? "fill-accent text-accent" : "text-muted-foreground"
            } ${interactive ? "cursor-pointer hover:fill-accent hover:text-accent" : ""}`}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Reviews ({reviews.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-accent text-accent" />
              <span className="text-2xl font-bold">{averageRating}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div>
              {!showForm ? (
                <Button onClick={() => setShowForm(true)} variant="outline" className="w-full">
                  Write a Review
                </Button>
              ) : (
                <div className="space-y-3 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Rating</label>
                    {renderStars(newReview.rating, true, (rating) => setNewReview({ ...newReview, rating }))}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Review</label>
                    <Textarea
                      placeholder="Share your experience..."
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSubmitReview} className="flex-1">Submit Review</Button>
                    <Button onClick={() => setShowForm(false)} variant="outline">Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4 pt-4 border-t">
            {reviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No reviews yet. Be the first to review!</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="space-y-2 p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {review.profiles?.full_name?.charAt(0) || review.profiles?.email?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{review.profiles?.full_name || "Anonymous"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-sm">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReviewSection;
