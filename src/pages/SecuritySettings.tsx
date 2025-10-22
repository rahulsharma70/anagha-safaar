import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthSecurity } from '@/hooks/useAuthSecurity';
import { PasswordStrengthIndicator, validatePassword } from '@/components/auth/PasswordStrengthIndicator';
import { Shield, Key, LogOut, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const SecuritySettings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { updatePassword, signOutAllDevices, sessionExpiresAt } = useAuthSecurity();

  const validation = validatePassword(newPassword);
  const passwordsMatch = newPassword === confirmPassword;

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validation.isValid || !passwordsMatch) return;

    setIsLoading(true);
    const { error } = await updatePassword(newPassword);
    
    if (!error) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    
    setIsLoading(false);
  };

  const handleSignOutAllDevices = async () => {
    if (confirm('Are you sure you want to sign out from all devices? This cannot be undone.')) {
      await signOutAllDevices();
    }
  };

  return (
    <ProtectedRoute requireAuth>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Security Settings</h1>
                <p className="text-muted-foreground">Manage your account security and privacy</p>
              </div>
            </div>

            <Tabs defaultValue="password" className="space-y-6">
              <TabsList>
                <TabsTrigger value="password">
                  <Key className="h-4 w-4 mr-2" />
                  Password
                </TabsTrigger>
                <TabsTrigger value="sessions">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sessions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="password">
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                      Update your password regularly to keep your account secure
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showPasswords ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(!showPasswords)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <PasswordStrengthIndicator password={newPassword} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                        <Input
                          id="confirm-new-password"
                          type={showPasswords ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                        {confirmPassword && !passwordsMatch && (
                          <p className="text-sm text-destructive">Passwords do not match</p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading || !validation.isValid || !passwordsMatch}
                      >
                        {isLoading ? "Updating..." : "Update Password"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sessions">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Sessions</CardTitle>
                    <CardDescription>
                      Manage your active sessions across all devices
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {sessionExpiresAt && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Current session expires at: {sessionExpiresAt.toLocaleString()}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">This Device</h3>
                          <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">Active</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Current browser session
                        </p>
                      </div>

                      <Button
                        variant="destructive"
                        onClick={handleSignOutAllDevices}
                        className="w-full"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out From All Devices
                      </Button>
                      
                      <p className="text-xs text-muted-foreground text-center">
                        This will sign you out from all browsers and devices. You'll need to sign in again.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default SecuritySettings;
