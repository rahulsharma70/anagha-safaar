import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Key,
  Bell,
  Database,
  Mail,
  Lock,
  Save,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const [saving, setSaving] = useState(false);

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    loginAttempts: 5,
    passwordExpiry: 90,
    ipWhitelist: "",
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    debugMode: false,
    autoBackup: true,
    backupFrequency: "daily",
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    senderEmail: "noreply@anaghasafar.com",
    senderName: "Anagha Safar",
  });

  const handleSave = async (section: string) => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`${section} settings saved successfully`);
    } catch (error) {
      toast.error(`Failed to save ${section} settings`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Admin Settings</h2>
        <p className="text-muted-foreground">Configure system, security, and email settings</p>
      </div>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Security Settings</CardTitle>
          </div>
          <CardDescription>Configure authentication and security policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
            </div>
            <Switch
              checked={securitySettings.twoFactorEnabled}
              onCheckedChange={(checked) =>
                setSecuritySettings({ ...securitySettings, twoFactorEnabled: checked })
              }
            />
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={securitySettings.sessionTimeout}
                onChange={(e) =>
                  setSecuritySettings({ ...securitySettings, sessionTimeout: Number(e.target.value) })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="loginAttempts">Max Login Attempts</Label>
              <Input
                id="loginAttempts"
                type="number"
                value={securitySettings.loginAttempts}
                onChange={(e) =>
                  setSecuritySettings({ ...securitySettings, loginAttempts: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
              <Input
                id="passwordExpiry"
                type="number"
                value={securitySettings.passwordExpiry}
                onChange={(e) =>
                  setSecuritySettings({ ...securitySettings, passwordExpiry: Number(e.target.value) })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ipWhitelist">IP Whitelist (comma-separated)</Label>
              <Input
                id="ipWhitelist"
                value={securitySettings.ipWhitelist}
                onChange={(e) =>
                  setSecuritySettings({ ...securitySettings, ipWhitelist: e.target.value })
                }
                placeholder="e.g., 192.168.1.1, 10.0.0.1"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => handleSave("Security")} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              Save Security Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>System Settings</CardTitle>
          </div>
          <CardDescription>Configure system behavior and maintenance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium">Maintenance Mode</p>
                <p className="text-sm text-muted-foreground">
                  Show maintenance page to all visitors
                </p>
              </div>
              {systemSettings.maintenanceMode && (
                <Badge variant="destructive">Active</Badge>
              )}
            </div>
            <Switch
              checked={systemSettings.maintenanceMode}
              onCheckedChange={(checked) =>
                setSystemSettings({ ...systemSettings, maintenanceMode: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium">Debug Mode</p>
                <p className="text-sm text-muted-foreground">
                  Enable detailed error messages (not for production)
                </p>
              </div>
              {systemSettings.debugMode && (
                <Badge variant="secondary">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Dev Only
                </Badge>
              )}
            </div>
            <Switch
              checked={systemSettings.debugMode}
              onCheckedChange={(checked) =>
                setSystemSettings({ ...systemSettings, debugMode: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Automatic Backups</p>
              <p className="text-sm text-muted-foreground">
                Automatically backup database {systemSettings.backupFrequency}
              </p>
            </div>
            <Switch
              checked={systemSettings.autoBackup}
              onCheckedChange={(checked) =>
                setSystemSettings({ ...systemSettings, autoBackup: checked })
              }
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={() => handleSave("System")} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              Save System Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>Email Configuration</CardTitle>
          </div>
          <CardDescription>Configure SMTP settings for sending emails</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                value={emailSettings.smtpHost}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                placeholder="smtp.example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input
                id="smtpPort"
                value={emailSettings.smtpPort}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                placeholder="587"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="smtpUser">SMTP Username</Label>
              <Input
                id="smtpUser"
                value={emailSettings.smtpUser}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="smtpPassword">SMTP Password</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={emailSettings.smtpPassword}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="senderEmail">Sender Email</Label>
              <Input
                id="senderEmail"
                type="email"
                value={emailSettings.senderEmail}
                onChange={(e) => setEmailSettings({ ...emailSettings, senderEmail: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="senderName">Sender Name</Label>
              <Input
                id="senderName"
                value={emailSettings.senderName}
                onChange={(e) => setEmailSettings({ ...emailSettings, senderName: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => toast.info("Test email sent!")}>
              Send Test Email
            </Button>
            <Button onClick={() => handleSave("Email")} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              Save Email Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle>API Keys</CardTitle>
          </div>
          <CardDescription>Manage third-party API integrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Razorpay Integration</p>
                <p className="text-sm text-muted-foreground">Payment gateway</p>
              </div>
              <Badge variant="default">Connected</Badge>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Resend Email</p>
                <p className="text-sm text-muted-foreground">Email service provider</p>
              </div>
              <Badge variant="default">Connected</Badge>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Amadeus API</p>
                <p className="text-sm text-muted-foreground">Flight data provider</p>
              </div>
              <Badge variant="outline">Not Configured</Badge>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            API keys are managed securely through environment variables. Contact your administrator to
            update these settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
