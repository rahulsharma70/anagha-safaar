import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  FileText,
  Image,
  Settings,
  Globe,
  Bell,
  Mail,
  Save,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function ContentManagement() {
  const [saving, setSaving] = useState(false);

  // Site Settings
  const [siteSettings, setSiteSettings] = useState({
    siteName: "Anagha Safar",
    tagline: "Discover India's Beauty",
    contactEmail: "support@anaghasafar.com",
    contactPhone: "+91 9876543210",
    address: "Mumbai, Maharashtra, India",
    socialFacebook: "",
    socialInstagram: "",
    socialTwitter: "",
  });

  // SEO Settings
  const [seoSettings, setSeoSettings] = useState({
    metaTitle: "Anagha Safar - Premium Travel Booking Platform",
    metaDescription: "Book hotels, flights, and tours across India with Anagha Safar. Best prices guaranteed.",
    metaKeywords: "travel, hotels, flights, tours, India, booking",
    ogImage: "",
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailBookingConfirmation: true,
    emailPaymentReceipt: true,
    emailCancellation: true,
    emailPromotion: false,
    smsBookingConfirmation: true,
    smsPaymentReminder: true,
  });

  // Homepage Content
  const [homepageContent, setHomepageContent] = useState({
    heroTitle: "Discover India's Beauty",
    heroSubtitle: "Book your perfect getaway with exclusive deals on hotels, flights, and tours",
    featuredSectionTitle: "Featured Destinations",
    testimonialsSectionTitle: "What Our Travelers Say",
  });

  const handleSave = async (section: string) => {
    setSaving(true);
    try {
      // In production, save to database or API
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
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Content Management</h2>
        <p className="text-muted-foreground">Manage site content, SEO, and settings</p>
      </div>

      <Tabs defaultValue="site" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="site" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Site Settings</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">SEO</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="homepage" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">Homepage</span>
          </TabsTrigger>
        </TabsList>

        {/* Site Settings */}
        <TabsContent value="site" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic site information and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={siteSettings.siteName}
                    onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={siteSettings.tagline}
                    onChange={(e) => setSiteSettings({ ...siteSettings, tagline: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={siteSettings.contactEmail}
                    onChange={(e) => setSiteSettings({ ...siteSettings, contactEmail: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Contact Phone</Label>
                  <Input
                    id="phone"
                    value={siteSettings.contactPhone}
                    onChange={(e) => setSiteSettings({ ...siteSettings, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={siteSettings.address}
                  onChange={(e) => setSiteSettings({ ...siteSettings, address: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("Site")} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>Link your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="facebook">Facebook URL</Label>
                  <Input
                    id="facebook"
                    placeholder="https://facebook.com/..."
                    value={siteSettings.socialFacebook}
                    onChange={(e) => setSiteSettings({ ...siteSettings, socialFacebook: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="instagram">Instagram URL</Label>
                  <Input
                    id="instagram"
                    placeholder="https://instagram.com/..."
                    value={siteSettings.socialInstagram}
                    onChange={(e) => setSiteSettings({ ...siteSettings, socialInstagram: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="twitter">Twitter URL</Label>
                  <Input
                    id="twitter"
                    placeholder="https://twitter.com/..."
                    value={siteSettings.socialTwitter}
                    onChange={(e) => setSiteSettings({ ...siteSettings, socialTwitter: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("Social")} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Links
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SEO Configuration</CardTitle>
              <CardDescription>Optimize your site for search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={seoSettings.metaTitle}
                  onChange={(e) => setSeoSettings({ ...seoSettings, metaTitle: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  {seoSettings.metaTitle.length}/60 characters
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={seoSettings.metaDescription}
                  onChange={(e) => setSeoSettings({ ...seoSettings, metaDescription: e.target.value })}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {seoSettings.metaDescription.length}/160 characters
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="metaKeywords">Meta Keywords</Label>
                <Input
                  id="metaKeywords"
                  value={seoSettings.metaKeywords}
                  onChange={(e) => setSeoSettings({ ...seoSettings, metaKeywords: e.target.value })}
                  placeholder="Comma-separated keywords"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ogImage">OG Image URL</Label>
                <Input
                  id="ogImage"
                  value={seoSettings.ogImage}
                  onChange={(e) => setSeoSettings({ ...seoSettings, ogImage: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("SEO")} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Save SEO Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Configure automated email notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Booking Confirmation</p>
                  <p className="text-sm text-muted-foreground">Send confirmation email after booking</p>
                </div>
                <Switch
                  checked={notificationSettings.emailBookingConfirmation}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, emailBookingConfirmation: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payment Receipt</p>
                  <p className="text-sm text-muted-foreground">Send receipt after successful payment</p>
                </div>
                <Switch
                  checked={notificationSettings.emailPaymentReceipt}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, emailPaymentReceipt: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Cancellation Notice</p>
                  <p className="text-sm text-muted-foreground">Send notice when booking is cancelled</p>
                </div>
                <Switch
                  checked={notificationSettings.emailCancellation}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, emailCancellation: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Promotional Emails</p>
                  <p className="text-sm text-muted-foreground">Send marketing and promotional content</p>
                </div>
                <Switch
                  checked={notificationSettings.emailPromotion}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, emailPromotion: checked })
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("Notification")} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Notifications
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SMS Notifications</CardTitle>
              <CardDescription>Configure SMS alerts for customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Booking Confirmation SMS</p>
                  <p className="text-sm text-muted-foreground">Send SMS when booking is confirmed</p>
                </div>
                <Switch
                  checked={notificationSettings.smsBookingConfirmation}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, smsBookingConfirmation: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Payment Reminder SMS</p>
                  <p className="text-sm text-muted-foreground">Send reminder for pending payments</p>
                </div>
                <Switch
                  checked={notificationSettings.smsPaymentReminder}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, smsPaymentReminder: checked })
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("SMS")} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Save SMS Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Homepage Content */}
        <TabsContent value="homepage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>Customize the homepage hero section</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="heroTitle">Hero Title</Label>
                <Input
                  id="heroTitle"
                  value={homepageContent.heroTitle}
                  onChange={(e) => setHomepageContent({ ...homepageContent, heroTitle: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                <Textarea
                  id="heroSubtitle"
                  value={homepageContent.heroSubtitle}
                  onChange={(e) => setHomepageContent({ ...homepageContent, heroSubtitle: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("Homepage")} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Content
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Section Titles</CardTitle>
              <CardDescription>Customize section headings on the homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="featuredTitle">Featured Section Title</Label>
                  <Input
                    id="featuredTitle"
                    value={homepageContent.featuredSectionTitle}
                    onChange={(e) =>
                      setHomepageContent({ ...homepageContent, featuredSectionTitle: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="testimonialsTitle">Testimonials Section Title</Label>
                  <Input
                    id="testimonialsTitle"
                    value={homepageContent.testimonialsSectionTitle}
                    onChange={(e) =>
                      setHomepageContent({ ...homepageContent, testimonialsSectionTitle: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("Section")} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Titles
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
