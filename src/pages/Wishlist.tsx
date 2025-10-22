import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Heart, Plane, Hotel, Map } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface WishlistItem {
  id: string;
  item_id: string;
  item_type: string;
  item_name: string;
  created_at: string;
}

const Wishlist = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('wishlist')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('wishlist')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Removed from wishlist');
      fetchWishlist();
    } catch (error: any) {
      toast.error('Failed to remove item');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="h-5 w-5" />;
      case 'hotel': return <Hotel className="h-5 w-5" />;
      case 'tour': return <Map className="h-5 w-5" />;
      default: return <Heart className="h-5 w-5" />;
    }
  };

  const viewDetails = (item: WishlistItem) => {
    navigate(`/${item.item_type}s/${item.item_id}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Please sign in to view your wishlist</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
          <p className="text-muted-foreground">Save your favorite trips for later</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p>Loading wishlist...</p>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Your wishlist is empty</p>
              <Button onClick={() => navigate('/')}>Browse Destinations</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getIcon(item.item_type)}
                      <CardTitle className="text-lg capitalize">{item.item_type}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromWishlist(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold mb-2">{item.item_name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Added {new Date(item.created_at).toLocaleDateString()}
                  </p>
                  <Button onClick={() => viewDetails(item)} className="w-full">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Wishlist;
