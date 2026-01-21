import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Gift, 
  Star, 
  Crown, 
  Sparkles, 
  TrendingUp, 
  Award, 
  Ticket,
  Percent,
  Plane,
  Hotel,
  CheckCircle,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface LoyaltyData {
  points: number;
  lifetime_points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface Reward {
  id: string;
  name: string;
  description: string;
  points_required: number;
  reward_type: string;
  reward_value: number;
  is_active: boolean;
  expires_at?: string;
}

interface RedeemedReward {
  id: string;
  reward_id: string;
  points_spent: number;
  status: string;
  redeemed_at: string;
  expires_at?: string;
  used_at?: string;
  reward?: Reward;
}

const TIER_CONFIG = {
  bronze: { icon: Star, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', threshold: 0, benefits: ['Earn 10 pts per ₹100', 'Birthday bonus'] },
  silver: { icon: Award, color: 'text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800/30', threshold: 1000, benefits: ['Earn 12 pts per ₹100', 'Priority support', '5% off flights'] },
  gold: { icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30', threshold: 5000, benefits: ['Earn 15 pts per ₹100', 'Free upgrades', '10% off all bookings', 'Lounge access'] },
  platinum: { icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30', threshold: 10000, benefits: ['Earn 20 pts per ₹100', 'Premium support', '15% off all bookings', 'Free cancellation', 'Exclusive deals'] },
};

export const LoyaltyRewards = () => {
  const { user } = useAuth();
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch loyalty points
      const { data: loyaltyData } = await (supabase as any)
        .from('loyalty_points')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      setLoyalty(loyaltyData || { points: 0, lifetime_points: 0, tier: 'bronze' });

      // Fetch available rewards
      const { data: rewardsData } = await (supabase as any)
        .from('loyalty_rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      setRewards(rewardsData || []);

      // Fetch user's redeemed rewards
      const { data: redeemedData } = await (supabase as any)
        .from('user_redeemed_rewards')
        .select('*, reward:loyalty_rewards(*)')
        .eq('user_id', user?.id)
        .order('redeemed_at', { ascending: false });

      setRedeemedRewards(redeemedData || []);
    } catch (error) {
      console.error('Failed to fetch loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const redeemReward = async () => {
    if (!selectedReward || !loyalty) return;

    if (loyalty.points < selectedReward.points_required) {
      toast.error('Not enough points to redeem this reward');
      return;
    }

    setRedeeming(true);
    try {
      // Deduct points
      const { error: pointsError } = await (supabase as any)
        .from('loyalty_points')
        .update({ points: loyalty.points - selectedReward.points_required })
        .eq('user_id', user?.id);

      if (pointsError) throw pointsError;

      // Create redeemed reward entry
      const { error: redeemError } = await (supabase as any)
        .from('user_redeemed_rewards')
        .insert({
          user_id: user?.id,
          reward_id: selectedReward.id,
          points_spent: selectedReward.points_required,
          status: 'active',
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
        });

      if (redeemError) throw redeemError;

      // Record transaction
      await (supabase as any)
        .from('loyalty_transactions')
        .insert({
          user_id: user?.id,
          points: -selectedReward.points_required,
          transaction_type: 'redeem',
          description: `Redeemed: ${selectedReward.name}`,
        });

      toast.success(`Successfully redeemed ${selectedReward.name}!`);
      setSelectedReward(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to redeem reward');
    } finally {
      setRedeeming(false);
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'discount': return <Percent className="h-6 w-6" />;
      case 'flight': return <Plane className="h-6 w-6" />;
      case 'hotel': return <Hotel className="h-6 w-6" />;
      case 'voucher': return <Ticket className="h-6 w-6" />;
      default: return <Gift className="h-6 w-6" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentTier = TIER_CONFIG[loyalty?.tier || 'bronze'];
  const nextTierKey = loyalty?.tier === 'bronze' ? 'silver' : loyalty?.tier === 'silver' ? 'gold' : loyalty?.tier === 'gold' ? 'platinum' : null;
  const nextTier = nextTierKey ? TIER_CONFIG[nextTierKey] : null;
  const progress = nextTier 
    ? ((loyalty?.lifetime_points || 0) - currentTier.threshold) / (nextTier.threshold - currentTier.threshold) * 100 
    : 100;

  return (
    <div className="space-y-6">
      {/* Loyalty Status Card */}
      <Card className="overflow-hidden">
        <div className={`h-2 ${currentTier.bg.replace('bg-', 'bg-gradient-to-r from-').replace('/30', ' to-primary')}`} />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <currentTier.icon className={`h-6 w-6 ${currentTier.color}`} />
                {(loyalty?.tier || 'bronze').charAt(0).toUpperCase() + (loyalty?.tier || 'bronze').slice(1)} Member
              </CardTitle>
              <CardDescription>Your loyalty rewards dashboard</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-primary">{(loyalty?.points || 0).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Available Points</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress to next tier */}
          {nextTier && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress to {nextTierKey}</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              <p className="text-xs text-muted-foreground text-center">
                {nextTier.threshold - (loyalty?.lifetime_points || 0)} more points to unlock {nextTierKey}
              </p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Gift className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{(loyalty?.lifetime_points || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Lifetime Points</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">+{Math.floor((loyalty?.points || 0) * 0.1)}</p>
              <p className="text-xs text-muted-foreground">This Month</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Ticket className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{redeemedRewards.filter(r => r.status === 'active').length}</p>
              <p className="text-xs text-muted-foreground">Active Rewards</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Award className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">{redeemedRewards.length}</p>
              <p className="text-xs text-muted-foreground">Total Redeemed</p>
            </div>
          </div>

          {/* Tier Benefits */}
          <div className="space-y-2">
            <h4 className="font-medium">Your {loyalty?.tier || 'bronze'} benefits:</h4>
            <div className="flex flex-wrap gap-2">
              {currentTier.benefits.map((benefit, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {benefit}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rewards Tabs */}
      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available">Available Rewards</TabsTrigger>
          <TabsTrigger value="redeemed">My Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {rewards.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Gift className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No rewards available yet</h3>
                <p className="text-muted-foreground">Check back soon for exciting rewards!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rewards.map((reward) => (
                <Card 
                  key={reward.id} 
                  className={`hover:shadow-lg transition-shadow ${(loyalty?.points || 0) >= reward.points_required ? 'border-primary/50' : 'opacity-75'}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-primary/10`}>
                        {getRewardIcon(reward.reward_type)}
                      </div>
                      <Badge variant={(loyalty?.points || 0) >= reward.points_required ? 'default' : 'secondary'}>
                        {reward.points_required.toLocaleString()} pts
                      </Badge>
                    </div>
                    <h3 className="font-semibold mb-2">{reward.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{reward.description}</p>
                    {reward.reward_value && (
                      <p className="text-lg font-bold text-primary mb-4">
                        {reward.reward_type === 'discount' ? `${reward.reward_value}% off` : `₹${reward.reward_value}`}
                      </p>
                    )}
                    <Button 
                      className="w-full"
                      disabled={(loyalty?.points || 0) < reward.points_required}
                      onClick={() => setSelectedReward(reward)}
                    >
                      {(loyalty?.points || 0) >= reward.points_required ? 'Redeem Now' : 'Not Enough Points'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="redeemed" className="space-y-4">
          {redeemedRewards.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No redeemed rewards yet</h3>
                <p className="text-muted-foreground">Redeem your points for exciting rewards!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {redeemedRewards.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-muted">
                        {getRewardIcon(item.reward?.reward_type || 'gift')}
                      </div>
                      <div>
                        <h4 className="font-medium">{item.reward?.name || 'Reward'}</h4>
                        <p className="text-sm text-muted-foreground">
                          Redeemed on {format(new Date(item.redeemed_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={item.status === 'active' ? 'default' : item.status === 'used' ? 'secondary' : 'outline'}>
                        {item.status === 'active' && <Clock className="h-3 w-3 mr-1" />}
                        {item.status}
                      </Badge>
                      {item.expires_at && item.status === 'active' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Expires {format(new Date(item.expires_at), 'MMM dd, yyyy')}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Redeem Confirmation Dialog */}
      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Reward</DialogTitle>
            <DialogDescription>
              Confirm your reward redemption
            </DialogDescription>
          </DialogHeader>
          {selectedReward && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="p-3 rounded-xl bg-primary/10">
                  {getRewardIcon(selectedReward.reward_type)}
                </div>
                <div>
                  <h4 className="font-semibold">{selectedReward.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedReward.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <span>Points to spend</span>
                <span className="font-bold text-primary">{selectedReward.points_required.toLocaleString()} pts</span>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <span>Points after redemption</span>
                <span className="font-bold">{((loyalty?.points || 0) - selectedReward.points_required).toLocaleString()} pts</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReward(null)}>Cancel</Button>
            <Button onClick={redeemReward} disabled={redeeming}>
              {redeeming ? 'Redeeming...' : 'Confirm Redemption'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
