import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gift, TrendingUp, Award } from 'lucide-react';

interface LoyaltyPointsProps {
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  platinum: 10000,
};

const TIER_COLORS = {
  bronze: 'bg-amber-600',
  silver: 'bg-gray-400',
  gold: 'bg-yellow-500',
  platinum: 'bg-purple-500',
};

export const LoyaltyPoints = ({ points, tier }: LoyaltyPointsProps) => {
  const nextTier = tier === 'bronze' ? 'silver' : tier === 'silver' ? 'gold' : tier === 'gold' ? 'platinum' : null;
  const currentThreshold = TIER_THRESHOLDS[tier];
  const nextThreshold = nextTier ? TIER_THRESHOLDS[nextTier] : TIER_THRESHOLDS.platinum;
  const progress = nextTier ? ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100 : 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Loyalty Points
          </CardTitle>
          <Badge className={`${TIER_COLORS[tier]} text-white capitalize`}>
            {tier} Member
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4">
          <div className="text-4xl font-bold text-primary">{points.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">Total Points</p>
        </div>

        {nextTier && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress to {nextTier}</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {nextThreshold - points} points to next tier
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">This Month</span>
            </div>
            <p className="text-2xl font-bold">+{Math.floor(points * 0.1)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Award className="h-4 w-4" />
              <span className="text-xs">Rewards</span>
            </div>
            <p className="text-2xl font-bold">{Math.floor(points / 100)}</p>
          </div>
        </div>

        <div className="pt-4 border-t space-y-2">
          <p className="text-sm font-medium">Earn More Points:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Book flights, hotels & tours (+10 pts per ₹100)</li>
            <li>• Write reviews (+50 pts per review)</li>
            <li>• Refer friends (+500 pts per referral)</li>
            <li>• Complete your profile (+100 pts)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
