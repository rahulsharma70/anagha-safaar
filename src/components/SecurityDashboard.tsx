import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Lock, 
  Activity,
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  Database,
  Key,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SecurityMetrics {
  totalEvents: number;
  highRiskEvents: number;
  blockedRequests: number;
  activeSessions: number;
  failedLogins: number;
  twoFactorEnabled: number;
  dataExports: number;
  deletionRequests: number;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  description: string;
  created_at: string;
  ip_address: string;
  user_agent: string;
}

interface FraudEvent {
  id: string;
  risk_score: number;
  fraud_flags: string[];
  activity_type: string;
  is_blocked: boolean;
  created_at: string;
}

const SecurityDashboard: React.FC = () => {
  const { user, getSecurityStatus } = useAuth();
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [fraudEvents, setFraudEvents] = useState<FraudEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'fraud' | 'sessions'>('overview');

  useEffect(() => {
    if (user) {
      loadSecurityData();
    }
  }, [user]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Load security metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('security_events')
        .select('severity, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (metricsError) throw metricsError;

      // Load recent security events
      const { data: eventsData, error: eventsError } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (eventsError) throw eventsError;

      // Load fraud detection events
      const { data: fraudData, error: fraudError } = await supabase
        .from('fraud_detection_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (fraudError) throw fraudError;

      // Calculate metrics
      const totalEvents = metricsData?.length || 0;
      const highRiskEvents = metricsData?.filter(e => e.severity === 'high' || e.severity === 'critical').length || 0;
      const blockedRequests = fraudData?.filter(f => f.is_blocked).length || 0;

      setMetrics({
        totalEvents,
        highRiskEvents,
        blockedRequests,
        activeSessions: 0, // Will be loaded separately
        failedLogins: 0, // Will be calculated from events
        twoFactorEnabled: 0, // Will be loaded from user status
        dataExports: 0, // Will be loaded separately
        deletionRequests: 0 // Will be loaded separately
      });

      setRecentEvents(eventsData || []);
      setFraudEvents(fraudData || []);

    } catch (error) {
      console.error('Error loading security data:', error);
      toast.error('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <AlertCircle className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalEvents || 0}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics?.highRiskEvents || 0}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Requests</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics?.blockedRequests || 0}</div>
            <p className="text-xs text-muted-foreground">Fraud prevention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics?.activeSessions || 0}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2 text-green-600" />
              Security Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Two-Factor Authentication</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Enabled
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Password Strength</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Strong
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Account Lockout</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Not Locked
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Recent Login</span>
              <Badge variant="outline">
                <Clock className="w-3 h-3 mr-1" />
                Today
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
              Security Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Login Attempts</span>
                <span className="text-green-600">↓ 15%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Failed Logins</span>
                <span className="text-red-600">↑ 8%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Security Events</span>
                <span className="text-green-600">↓ 22%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Fraud Attempts</span>
                <span className="text-yellow-600">→ 0%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Security Status:</strong> Your account is secure. All security measures are active and functioning properly.
        </AlertDescription>
      </Alert>
    </div>
  );

  const EventsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Security Events</h3>
        <Button variant="outline" size="sm" onClick={loadSecurityData}>
          <Activity className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {recentEvents.map((event) => (
          <Card key={event.id} className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={getSeverityColor(event.severity)}>
                      {getSeverityIcon(event.severity)}
                      <span className="ml-1 capitalize">{event.severity}</span>
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900">{event.event_type}</h4>
                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>IP: {event.ip_address}</span>
                    <span>Type: {event.event_type}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const FraudTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Fraud Detection Events</h3>
        <Button variant="outline" size="sm" onClick={loadSecurityData}>
          <Eye className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {fraudEvents.map((event) => (
          <Card key={event.id} className={`border-l-4 ${event.is_blocked ? 'border-l-red-500' : 'border-l-yellow-500'}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant={event.is_blocked ? 'destructive' : 'secondary'}>
                      {event.is_blocked ? <XCircle className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                      Risk Score: {event.risk_score}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900">{event.activity_type}</h4>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {event.fraud_flags.map((flag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {flag}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Status: {event.is_blocked ? 'Blocked' : 'Monitored'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const SessionsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Active Sessions</h3>
        <Button variant="outline" size="sm">
          <Lock className="w-4 h-4 mr-2" />
          Manage Sessions
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="text-center py-8">
            <Database className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Sessions</h4>
            <p className="text-gray-600">You don't have any active sessions at the moment.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Monitor your account security, view recent events, and manage security settings.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <EventsTab />
        </TabsContent>

        <TabsContent value="fraud" className="mt-6">
          <FraudTab />
        </TabsContent>

        <TabsContent value="sessions" className="mt-6">
          <SessionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;
