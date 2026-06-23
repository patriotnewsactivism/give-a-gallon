import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicLayout } from "./components/PublicLayout";
import { PublicOnlyRoute } from "./components/PublicOnlyRoute";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./contexts/ThemeContext";
import {
  CreatorProfilePage,
  DashboardPage,
  ExplorePage,
  ImpactPage,
  LeaderboardPage,
  MembershipPage,
  LandingPage,
  LoginPage,
  MyImpactPage,
  SettingsPage,
  SignupPage,
  AdminDashboard,
  PrivacyPolicyPage,
  TermsOfServicePage,
  SupportPage,
  FirmOnboardingPage,
} from "./pages";
import { DonationSuccessPage } from "./pages/DonationSuccessPage";
import { DonationCancelPage } from "./pages/DonationCancelPage";
import ReferralPage from "./pages/ReferralPage";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={false}>
        <Toaster />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/impact" element={<ImpactPage />} />
            <Route path="/membership" element={<MembershipPage />} />
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Route>
            <Route path="/donation-success" element={<DonationSuccessPage />} />
            <Route path="/donation-cancel" element={<DonationCancelPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/tos" element={<TermsOfServicePage />} />
            <Route path="/support" element={<SupportPage />} />
            {/* Common URL aliases — redirect before the /:slug catch-all */}
            <Route path="/browse" element={<Navigate to="/explore" replace />} />
            <Route path="/campaigns" element={<Navigate to="/explore" replace />} />
            <Route path="/start" element={<Navigate to="/signup" replace />} />
            {/* Firm Onboarding — tailored link for organizations */}
            <Route path="/:slug/join" element={<FirmOnboardingPage />} />
            {/* Public creator profile — must be last in public routes */}
            <Route path="/:slug" element={<CreatorProfilePage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/my-impact" element={<MyImpactPage />} />
              <Route path="/referrals" element={<ReferralPage />} />
            </Route>
          </Route>

          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
