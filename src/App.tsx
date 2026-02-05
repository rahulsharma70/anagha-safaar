import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthSecurityProvider } from "@/hooks/useAuthSecurity";
import { BookingProvider } from "@/contexts/BookingContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { SessionExpirationModal } from "@/components/auth/SessionExpirationModal";
import { useEffect } from "react";
import { AppContent } from "@/components/AppContent";
 import { LiveChatWidget } from "@/components/contact/LiveChatWidget";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import EnhancedAuth from "./pages/EnhancedAuth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SecuritySettings from "./pages/SecuritySettings";
import AccessDenied from "./pages/AccessDenied";
import Hotels from "./pages/Hotels";
import HotelDetail from "./pages/HotelDetail";
import Tours from "./pages/Tours";
import TourDetail from "./pages/TourDetail";
import Flights from "./pages/Flights";
import FlightDetail from "./pages/FlightDetail";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import Contact from "./pages/Contact";
import HelpCenter from "./pages/HelpCenter";
import CancellationPolicy from "./pages/CancellationPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import UserDashboard from "./components/dashboard/UserDashboard";
import BookingCheckout from "./pages/BookingCheckout";
import BookingConfirmationPage from "./pages/BookingConfirmationPage";
import DashboardSettings from "./pages/DashboardSettings";
import DashboardNotifications from "./pages/DashboardNotifications";
import Wishlist from "./pages/Wishlist";
import AITripPlanner from "./pages/AITripPlanner";

// Admin Panel Imports
import {
  AdminLayout,
  AdminDashboard,
  UsersManagement,
  BookingsManagement,
  HotelsManagement,
  FlightsManagement,
  ToursManagement,
  AnalyticsDashboard,
  ContentManagement,
  AdminSettings,
} from "./pages/admin";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  useEffect(() => {
    // App initialization
    console.log('App initialized');
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="anagha-safar-theme">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <AuthSecurityProvider>
                  <SessionExpirationModal />
                  <AppContent>
                    <BookingProvider>
                <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<EnhancedAuth />} />
                <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
                <Route path="/security-settings" element={<SecuritySettings />} />
                <Route path="/access-denied" element={<AccessDenied />} />
                <Route path="/hotels" element={<Hotels />} />
                <Route path="/hotels/:slug" element={<HotelDetail />} />
                <Route path="/tours" element={<Tours />} />
                <Route path="/tours/:slug" element={<TourDetail />} />
                <Route path="/flights" element={<Flights />} />
                <Route path="/flights/:id" element={<FlightDetail />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/user-dashboard" element={<UserDashboard />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/cancellation-policy" element={<CancellationPolicy />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
            <Route path="/booking/checkout" element={<BookingCheckout />} />
            <Route path="/booking/confirmation/:bookingId" element={<BookingConfirmationPage />} />
            <Route path="/dashboard/settings" element={<DashboardSettings />} />
            <Route path="/dashboard/notifications" element={<DashboardNotifications />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/itinerary" element={<AITripPlanner />} />
            
            {/* Admin Panel Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="analytics" element={<AnalyticsDashboard />} />
              <Route path="users" element={<UsersManagement />} />
              <Route path="bookings" element={<BookingsManagement />} />
              <Route path="hotels" element={<HotelsManagement />} />
              <Route path="flights" element={<FlightsManagement />} />
              <Route path="tours" element={<ToursManagement />} />
              <Route path="content" element={<ContentManagement />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </BookingProvider>
                   <LiveChatWidget />
                  </AppContent>
                </AuthSecurityProvider>
              </AuthProvider>
            </BrowserRouter>
        </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
