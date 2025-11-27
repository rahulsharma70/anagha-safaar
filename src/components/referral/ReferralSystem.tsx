import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Share2, Users, Copy, Check } from 'lucide-react';
import { logger } from '@/lib/logger';

export const ReferralSystem = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [referralStats, setReferralStats] = useState({ count: 0, earnings: 0 });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    if (!user) return;

    try {
      // Get or create referral code
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

      const prefs = profile?.preferences as any;
      let code = prefs?.referral_code;
      if (!code) {
        code = generateReferralCode();
        const updatedPrefs = typeof prefs === 'object' ? { ...prefs, referral_code: code } : { referral_code: code };
        await supabase
          .from('profiles')
          .update({
            preferences: updatedPrefs,
          })
          .eq('id', user.id);
      }

      setReferralCode(code);

      // Get referral stats (using any to bypass type checking until types regenerate)
      const { data: referrals } = await (supabase as any)
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id);

      setReferralStats({
        count: referrals?.length || 0,
        earnings: (referrals?.length || 0) * 500, // ₹500 per referral
      });
    } catch (error: any) {
      logger.error('Failed to fetch referral data', error as Error, {
        component: 'ReferralSystem',
        userId: user?.id
      });
      toast.error('Unable to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = () => {
    return `AS${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    const link = `${window.location.origin}?ref=${referralCode}`;
    const text = `Join me on Anagha Safaar and get ₹500 off on your first booking! Use my referral code: ${referralCode}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Anagha Safaar Referral', text, url: link });
        toast.success('Shared successfully!');
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      copyReferralLink();
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Referral Program
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Invite Friends, Earn Rewards!</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Share your referral code and earn ₹500 for each friend who makes their first booking.
            Your friends get ₹500 off too!
          </p>
          
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={`${window.location.origin}?ref=${referralCode}`}
                readOnly
                className="font-mono"
              />
              <Button onClick={copyReferralLink} variant="outline" size="icon">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button onClick={shareReferral} className="w-full" variant="default">
              <Share2 className="h-4 w-4 mr-2" />
              Share Referral Link
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-3xl font-bold text-primary">{referralStats.count}</div>
            <p className="text-sm text-muted-foreground">Successful Referrals</p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-3xl font-bold text-primary">₹{referralStats.earnings}</div>
            <p className="text-sm text-muted-foreground">Total Earnings</p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-3">Your Referral Code</h4>
          <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
            <Badge variant="outline" className="text-2xl font-bold px-6 py-2">
              {referralCode}
            </Badge>
          </div>
        </div>

        <div className="pt-4 border-t space-y-2">
          <h4 className="font-medium">How it works:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Share your unique referral code with friends</li>
            <li>They sign up and make their first booking</li>
            <li>You both get ₹500 in rewards</li>
            <li>Track your earnings in real-time</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
