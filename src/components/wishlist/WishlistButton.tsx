import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WishlistButtonProps {
  itemId: string;
  itemType: 'hotel' | 'tour' | 'flight';
  itemName: string;
}

export const WishlistButton = ({ itemId, itemType, itemName }: WishlistButtonProps) => {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
    }
  }, [user, itemId]);

  const checkFavoriteStatus = async () => {
    if (!user) return;

    const { data } = await (supabase as any)
      .from('wishlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_id', itemId)
      .eq('item_type', itemType)
      .maybeSingle();

    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Please sign in to add to wishlist');
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        const { error } = await (supabase as any)
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', itemId)
          .eq('item_type', itemType);

        if (error) throw error;
        toast.success('Removed from wishlist');
        setIsFavorite(false);
      } else {
        const { error } = await (supabase as any)
          .from('wishlist')
          .insert({
            user_id: user.id,
            item_id: itemId,
            item_type: itemType,
            item_name: itemName,
          });

        if (error) throw error;
        toast.success('Added to wishlist');
        setIsFavorite(true);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update wishlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleFavorite}
      disabled={loading}
      className={isFavorite ? 'bg-primary/10 border-primary' : ''}
    >
      <Heart className={`h-4 w-4 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
    </Button>
  );
};
