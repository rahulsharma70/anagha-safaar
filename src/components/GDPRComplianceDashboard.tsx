import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Download, 
  Trash2, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  FileText,
  User,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { GDPRComplianceService } from '@/lib/security';

interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: string;
  given_at: string;
  expires_at?: string;
  purpose: string;
  data_categories: string[];
  status: 'active' | 'withdrawn' | 'expired';
}

interface DataExport {
  id: string;
  user_id: string;
  requested_at: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  download_url?: string;
  expires_at: string;
}

interface PersonalData {
  id: string;
  category: string;
  data_type: string;
  value: string;
  collected_at: string;
  purpose: string;
  retention_period: string;
}

const GDPRComplianceDashboard: React.FC = () => {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [dataExports, setDataExports] = useState<DataExport[]>([]);
  const [personalData, setPersonalData] = useState<PersonalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'consent' | 'data' | 'export' | 'deletion'>('consent');

  useEffect(() => {
    loadGDPRData();
  }, []);

  const loadGDPRData = async () => {
    try {
      setLoading(true);
      
      // Load user's consent records
      const { data: consentData, error: consentError } = await supabase
        .from('user_consents')
        .select('*')
        .order('given_at', { ascending: false });

      if (consentError) throw consentError;
      setConsents(consentData || []);

      // Load data export requests
      const { data: exportData, error: exportError } = await supabase
        .from('data_exports')
        .select('*')
        .order('requested_at', { ascending: false });

      if (exportError) throw exportError;
      setDataExports(exportData || []);

      // Load personal data inventory
      const { data: personalDataResult, error: personalDataError } = await supabase
        .from('personal_data_inventory')
        .select('*')
        .order('collected_at', { ascending: false });

      if (personalDataError) throw personalDataError;
      setPersonalData(personalDataResult || []);

    } catch (error) {
      console.error('Error loading GDPR data:', error);
      toast.error('Failed to load GDPR data');
    } finally {
      setLoading(false);
    }
  };

  const handleConsentWithdrawal = async (consentId: string) => {
    try {
      const { error } = await supabase
        .from('user_consents')
        .update({ 
          status: 'withdrawn',
          withdrawn_at: new Date().toISOString()
        })
        .eq('id', consentId);

      if (error) throw error;

      toast.success('Consent withdrawn successfully');
      loadGDPRData();
    } catch (error) {
      console.error('Error withdrawing consent:', error);
      toast.error('Failed to withdraw consent');
    }
  };

  const handleDataExportRequest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const exportRequest = GDPRComplianceService.generateDataExport(user.id);
      
      const { error } = await supabase
        .from('data_exports')
        .insert(exportRequest);

      if (error) throw error;

      toast.success('Data export request submitted. You will receive an email when ready.');
      loadGDPRData();
    } catch (error) {
      console.error('Error requesting data export:', error);
      toast.error('Failed to request data export');
    }
  };

  const handleDataDeletionRequest = async (dataCategories: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('data_deletion_requests')
        .insert({
          user_id: user.id,
          request_id: `deletion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          data_categories: dataCategories,
          requested_at: new Date().toISOString(),
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Data deletion request submitted. This will be processed within 30 days.');
    } catch (error) {
      console.error('Error requesting data deletion:', error);
      toast.error('Failed to request data deletion');
    }
  };

  const ConsentManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Consent Management</h3>
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle className="w-4 h-4 mr-1" />
          GDPR Compliant
        </Badge>
      </div>

      <div className="grid gap-4">
        {consents.map((consent) => (
          <Card key={consent.id} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{consent.consent_type}</CardTitle>
                <Badge 
                  variant={consent.status === 'active' ? 'default' : 'secondary'}
                  className={consent.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                >
                  {consent.status}
                </Badge>
              </div>
              <CardDescription>{consent.purpose}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  <strong>Data Categories:</strong> {consent.data_categories.join(', ')}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Given:</strong> {new Date(consent.given_at).toLocaleDateString()}
                </div>
                {consent.expires_at && (
                  <div className="text-sm text-gray-600">
                    <strong>Expires:</strong> {new Date(consent.expires_at).toLocaleDateString()}
                  </div>
                )}
              </div>
              {consent.status === 'active' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => handleConsentWithdrawal(consent.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Withdraw Consent
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const PersonalDataInventory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Personal Data Inventory</h3>
        <Badge variant="outline">
          <Eye className="w-4 h-4 mr-1" />
          {personalData.length} Records
        </Badge>
      </div>

      <div className="grid gap-4">
        {personalData.map((data) => (
          <Card key={data.id} className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{data.data_type}</CardTitle>
                <Badge variant="outline">{data.category}</Badge>
              </div>
              <CardDescription>{data.purpose}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  <strong>Value:</strong> {data.value}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Collected:</strong> {new Date(data.collected_at).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Retention:</strong> {data.retention_period}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const DataExportSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Data Export Requests</h3>
        <Button onClick={handleDataExportRequest} className="bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" />
          Request Data Export
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You have the right to receive a copy of your personal data in a structured, 
          commonly used format. Export requests are processed within 30 days.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {dataExports.map((exportReq) => (
          <Card key={exportReq.id} className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Export Request #{exportReq.id.slice(-8)}</CardTitle>
                <Badge 
                  variant={exportReq.status === 'completed' ? 'default' : 'secondary'}
                  className={exportReq.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                >
                  {exportReq.status}
                </Badge>
              </div>
              <CardDescription>
                Requested on {new Date(exportReq.requested_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {exportReq.status === 'completed' && exportReq.download_url && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(exportReq.download_url, '_blank')}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download Data
                </Button>
              )}
              {exportReq.status === 'pending' && (
                <div className="text-sm text-gray-600">
                  Your export request is being processed. You will receive an email when ready.
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const DataDeletionSection = () => {
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [deletionReason, setDeletionReason] = useState('');

    const dataCategories = [
      'Profile Information',
      'Booking History',
      'Payment Data',
      'Communication Records',
      'Preferences',
      'Analytics Data'
    ];

    const handleCategoryToggle = (category: string) => {
      setSelectedCategories(prev => 
        prev.includes(category) 
          ? prev.filter(c => c !== category)
          : [...prev, category]
      );
    };

    const handleDeletionSubmit = () => {
      if (selectedCategories.length === 0) {
        toast.error('Please select at least one data category to delete');
        return;
      }

      if (!deletionReason.trim()) {
        toast.error('Please provide a reason for data deletion');
        return;
      }

      handleDataDeletionRequest(selectedCategories);
      setSelectedCategories([]);
      setDeletionReason('');
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Right to Erasure</h3>
          <Badge variant="destructive">
            <Trash2 className="w-4 h-4 mr-1" />
            Permanent Action
          </Badge>
        </div>

        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Warning:</strong> Data deletion is permanent and cannot be undone. 
            This may affect your ability to use our services.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Select Data Categories to Delete</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {dataCategories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  />
                  <Label htmlFor={category} className="text-sm">
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="deletion-reason" className="text-base font-medium">
              Reason for Deletion (Required)
            </Label>
            <Textarea
              id="deletion-reason"
              placeholder="Please explain why you want to delete this data..."
              value={deletionReason}
              onChange={(e) => setDeletionReason(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          <Button 
            variant="destructive" 
            onClick={handleDeletionSubmit}
            disabled={selectedCategories.length === 0 || !deletionReason.trim()}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Submit Deletion Request
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">GDPR Compliance Center</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Manage your personal data, consent preferences, and exercise your rights under GDPR.
        </p>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'consent', label: 'Consent Management', icon: CheckCircle },
          { id: 'data', label: 'Data Inventory', icon: Eye },
          { id: 'export', label: 'Data Export', icon: Download },
          { id: 'deletion', label: 'Data Deletion', icon: Trash2 }
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            onClick={() => setActiveTab(tab.id as any)}
            className="flex-1"
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          {activeTab === 'consent' && <ConsentManagement />}
          {activeTab === 'data' && <PersonalDataInventory />}
          {activeTab === 'export' && <DataExportSection />}
          {activeTab === 'deletion' && <DataDeletionSection />}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <FileText className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900">Your Rights Under GDPR</h3>
              <div className="mt-2 space-y-1 text-sm text-blue-800">
                <div>• <strong>Right to Access:</strong> Request a copy of your personal data</div>
                <div>• <strong>Right to Rectification:</strong> Correct inaccurate personal data</div>
                <div>• <strong>Right to Erasure:</strong> Request deletion of your personal data</div>
                <div>• <strong>Right to Portability:</strong> Receive your data in a structured format</div>
                <div>• <strong>Right to Object:</strong> Object to processing of your personal data</div>
                <div>• <strong>Right to Restrict Processing:</strong> Limit how we use your data</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GDPRComplianceDashboard;
