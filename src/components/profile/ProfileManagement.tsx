import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Shield, 
  Heart, 
  Users, 
  FileText, 
  Plus, 
  Trash2, 
  Save,
  AlertCircle,
  Plane,
  UtensilsCrossed,
  Accessibility
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface TravelCompanion {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  relationship?: string;
  passport_number?: string;
  passport_expiry?: string;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

interface TravelPreferences {
  seat_preference?: 'window' | 'aisle' | 'middle';
  meal_preference?: 'vegetarian' | 'vegan' | 'non-vegetarian' | 'halal' | 'kosher';
  special_assistance?: string[];
  preferred_airlines?: string[];
  preferred_hotel_chains?: string[];
  room_preference?: 'smoking' | 'non-smoking';
  bed_preference?: 'single' | 'double' | 'twin' | 'king';
}

interface ProfileData {
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  nationality?: string;
  passport_number?: string;
  passport_expiry?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
  travel_preferences?: TravelPreferences;
  emergency_contacts?: EmergencyContact[];
}

export const ProfileManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [companions, setCompanions] = useState<TravelCompanion[]>([]);
  const [newCompanion, setNewCompanion] = useState<Partial<TravelCompanion>>({});
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [newEmergencyContact, setNewEmergencyContact] = useState<Partial<EmergencyContact>>({});

  useEffect(() => {
    if (user) {
      fetchProfileData();
      fetchCompanions();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      setProfile({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        avatar_url: data.avatar_url || '',
        date_of_birth: (data as any).date_of_birth || '',
        nationality: (data as any).nationality || '',
        passport_number: (data as any).passport_number || '',
        passport_expiry: (data as any).passport_expiry || '',
        address: (data as any).address || {},
        travel_preferences: (data as any).travel_preferences || {},
        emergency_contacts: (data as any).emergency_contacts || [],
      });
      setEmergencyContacts((data as any).emergency_contacts || []);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanions = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('travel_companions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanions(data || []);
    } catch (error) {
      console.error('Failed to fetch companions:', error);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          date_of_birth: profile.date_of_birth || null,
          nationality: profile.nationality || null,
          passport_number: profile.passport_number || null,
          passport_expiry: profile.passport_expiry || null,
          address: profile.address || {},
          travel_preferences: profile.travel_preferences || {},
          emergency_contacts: emergencyContacts,
        } as any)
        .eq('id', user?.id);

      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const addCompanion = async () => {
    if (!newCompanion.full_name) {
      toast.error('Companion name is required');
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('travel_companions')
        .insert({
          user_id: user?.id,
          ...newCompanion,
        });

      if (error) throw error;
      toast.success('Travel companion added!');
      setNewCompanion({});
      fetchCompanions();
    } catch (error) {
      toast.error('Failed to add companion');
    }
  };

  const removeCompanion = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('travel_companions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Companion removed');
      fetchCompanions();
    } catch (error) {
      toast.error('Failed to remove companion');
    }
  };

  const addEmergencyContact = () => {
    if (!newEmergencyContact.name || !newEmergencyContact.phone) {
      toast.error('Name and phone are required');
      return;
    }
    setEmergencyContacts([...emergencyContacts, newEmergencyContact as EmergencyContact]);
    setNewEmergencyContact({});
  };

  const removeEmergencyContact = (index: number) => {
    setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="companions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Companions</span>
          </TabsTrigger>
          <TabsTrigger value="emergency" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Emergency</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Information */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Manage your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-accent text-white">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{profile?.full_name}</h3>
                  <p className="text-muted-foreground">{profile?.email}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile?.full_name || ''}
                    onChange={(e) => setProfile({ ...profile!, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile?.phone || ''}
                    onChange={(e) => setProfile({ ...profile!, phone: e.target.value })}
                    placeholder="+91 XXXXXXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={profile?.date_of_birth || ''}
                    onChange={(e) => setProfile({ ...profile!, date_of_birth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={profile?.nationality || ''}
                    onChange={(e) => setProfile({ ...profile!, nationality: e.target.value })}
                    placeholder="Indian"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Address</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Textarea
                      id="street"
                      value={profile?.address?.street || ''}
                      onChange={(e) => setProfile({
                        ...profile!,
                        address: { ...profile?.address, street: e.target.value }
                      })}
                      placeholder="123 Main Street, Apartment 4B"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={profile?.address?.city || ''}
                      onChange={(e) => setProfile({
                        ...profile!,
                        address: { ...profile?.address, city: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={profile?.address?.state || ''}
                      onChange={(e) => setProfile({
                        ...profile!,
                        address: { ...profile?.address, state: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={profile?.address?.country || ''}
                      onChange={(e) => setProfile({
                        ...profile!,
                        address: { ...profile?.address, country: e.target.value }
                      })}
                      placeholder="India"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={profile?.address?.postal_code || ''}
                      onChange={(e) => setProfile({
                        ...profile!,
                        address: { ...profile?.address, postal_code: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={saveProfile} disabled={saving} className="w-full md:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Travel Documents */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Travel Documents</CardTitle>
              <CardDescription>Store your passport and ID details for quick booking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Your documents are encrypted and securely stored
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    We use bank-level encryption to protect your sensitive information.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="passportNumber">Passport Number</Label>
                  <Input
                    id="passportNumber"
                    value={profile?.passport_number || ''}
                    onChange={(e) => setProfile({ ...profile!, passport_number: e.target.value })}
                    placeholder="A1234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passportExpiry">Passport Expiry Date</Label>
                  <Input
                    id="passportExpiry"
                    type="date"
                    value={profile?.passport_expiry || ''}
                    onChange={(e) => setProfile({ ...profile!, passport_expiry: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={saveProfile} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Documents'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Travel Preferences */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Travel Preferences</CardTitle>
              <CardDescription>Set your preferences for a personalized travel experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Plane className="h-4 w-4" />
                    Flight Preferences
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Seat Preference</Label>
                      <Select
                        value={profile?.travel_preferences?.seat_preference || ''}
                        onValueChange={(value) => setProfile({
                          ...profile!,
                          travel_preferences: { ...profile?.travel_preferences, seat_preference: value as any }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select seat preference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="window">Window</SelectItem>
                          <SelectItem value="aisle">Aisle</SelectItem>
                          <SelectItem value="middle">Middle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <UtensilsCrossed className="h-4 w-4" />
                    Meal Preferences
                  </h4>
                  <div className="space-y-2">
                    <Label>Meal Type</Label>
                    <Select
                      value={profile?.travel_preferences?.meal_preference || ''}
                      onValueChange={(value) => setProfile({
                        ...profile!,
                        travel_preferences: { ...profile?.travel_preferences, meal_preference: value as any }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select meal preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vegetarian">Vegetarian</SelectItem>
                        <SelectItem value="vegan">Vegan</SelectItem>
                        <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                        <SelectItem value="halal">Halal</SelectItem>
                        <SelectItem value="kosher">Kosher</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Accessibility className="h-4 w-4" />
                    Room Preferences
                  </h4>
                  <div className="grid gap-3">
                    <div className="space-y-2">
                      <Label>Room Type</Label>
                      <Select
                        value={profile?.travel_preferences?.room_preference || ''}
                        onValueChange={(value) => setProfile({
                          ...profile!,
                          travel_preferences: { ...profile?.travel_preferences, room_preference: value as any }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select room preference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="smoking">Smoking</SelectItem>
                          <SelectItem value="non-smoking">Non-Smoking</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Bed Preference</Label>
                      <Select
                        value={profile?.travel_preferences?.bed_preference || ''}
                        onValueChange={(value) => setProfile({
                          ...profile!,
                          travel_preferences: { ...profile?.travel_preferences, bed_preference: value as any }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select bed preference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="double">Double</SelectItem>
                          <SelectItem value="twin">Twin</SelectItem>
                          <SelectItem value="king">King</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={saveProfile} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Travel Companions */}
        <TabsContent value="companions">
          <Card>
            <CardHeader>
              <CardTitle>Travel Companions</CardTitle>
              <CardDescription>Add frequent travel companions for quick booking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Companion Form */}
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-medium">Add New Companion</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={newCompanion.full_name || ''}
                      onChange={(e) => setNewCompanion({ ...newCompanion, full_name: e.target.value })}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship</Label>
                    <Select
                      value={newCompanion.relationship || ''}
                      onValueChange={(value) => setNewCompanion({ ...newCompanion, relationship: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="colleague">Colleague</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newCompanion.email || ''}
                      onChange={(e) => setNewCompanion({ ...newCompanion, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={newCompanion.phone || ''}
                      onChange={(e) => setNewCompanion({ ...newCompanion, phone: e.target.value })}
                      placeholder="+91 XXXXXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={newCompanion.date_of_birth || ''}
                      onChange={(e) => setNewCompanion({ ...newCompanion, date_of_birth: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Passport Number</Label>
                    <Input
                      value={newCompanion.passport_number || ''}
                      onChange={(e) => setNewCompanion({ ...newCompanion, passport_number: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={addCompanion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Companion
                </Button>
              </div>

              {/* Companions List */}
              <div className="space-y-3">
                <h4 className="font-medium">Saved Companions ({companions.length})</h4>
                {companions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No travel companions added yet. Add your frequent travel partners above.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {companions.map((companion) => (
                      <div key={companion.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{companion.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{companion.full_name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {companion.relationship && (
                                <Badge variant="outline" className="capitalize">
                                  {companion.relationship}
                                </Badge>
                              )}
                              {companion.email && <span>{companion.email}</span>}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCompanion(companion.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Contacts */}
        <TabsContent value="emergency">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contacts</CardTitle>
              <CardDescription>Add contacts to notify in case of emergency during travel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Emergency Contact */}
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-medium">Add Emergency Contact</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={newEmergencyContact.name || ''}
                      onChange={(e) => setNewEmergencyContact({ ...newEmergencyContact, name: e.target.value })}
                      placeholder="Contact name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship *</Label>
                    <Select
                      value={newEmergencyContact.relationship || ''}
                      onValueChange={(value) => setNewEmergencyContact({ ...newEmergencyContact, relationship: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input
                      value={newEmergencyContact.phone || ''}
                      onChange={(e) => setNewEmergencyContact({ ...newEmergencyContact, phone: e.target.value })}
                      placeholder="+91 XXXXXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newEmergencyContact.email || ''}
                      onChange={(e) => setNewEmergencyContact({ ...newEmergencyContact, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <Button onClick={addEmergencyContact}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>

              {/* Emergency Contacts List */}
              <div className="space-y-3">
                <h4 className="font-medium">Saved Emergency Contacts ({emergencyContacts.length})</h4>
                {emergencyContacts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No emergency contacts added yet.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {emergencyContacts.map((contact, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="capitalize">{contact.relationship}</Badge>
                            <span>{contact.phone}</span>
                            {contact.email && <span>• {contact.email}</span>}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEmergencyContact(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {emergencyContacts.length > 0 && (
                  <Button onClick={saveProfile} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Emergency Contacts'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
