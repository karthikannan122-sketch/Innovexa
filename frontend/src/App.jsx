import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import AppShell from './components/AppShell';
import CommandPalette from './components/CommandPalette';
import ApiKeyModal from './components/ApiKeyModal';
import PersonaSwitcherModal from './components/PersonaSwitcherModal';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import ExplorePage from './pages/ExplorePage';
import SubmitInnovationPage from './pages/SubmitInnovationPage';
import ReviewQueuePage from './pages/ReviewQueuePage';
import ReviewSubmissionPage from './pages/ReviewSubmissionPage';
import InsightReportPage from './pages/InsightReportPage';
import PublishedDetailPage from './pages/PublishedDetailPage';
import CreatorDashboardPage from './pages/CreatorDashboardPage';
import UserProfilePage from './pages/UserProfilePage';
import SettingsPage from './pages/SettingsPage';
import MessagesPage from './pages/MessagesPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import CommunityPage from './pages/CommunityPage';
import InsightsPage from './pages/InsightsPage';

function AppContent() {
  const { currentUser, isLoadingAuth, redirectPath, setRedirectPath, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState('landing');
  const [selectedInnoId, setSelectedInnoId] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [selectedRecipientId, setSelectedRecipientId] = useState(null);
  const [exploreFilters, setExploreFilters] = useState({ search: '', category: 'ALL' });

  // Public & Protected Routes
  const publicRoutes = ['landing', 'login', 'signup', 'explore', 'community', 'insights', 'detail'];

  useEffect(() => {
    if (isLoadingAuth) return; // Wait for initial Supabase session resolution

    // If unauthenticated visitor attempts to access protected routes
    if (!currentUser && !publicRoutes.includes(activeTab)) {
      setRedirectPath(activeTab);
      setActiveTab('login');
      showToast('Please sign in to access that workspace area.', 'info');
      return;
    }

    // If authenticated user is on login or signup page, automatically transition to next page
    if (currentUser && (activeTab === 'login' || activeTab === 'signup')) {
      if (!currentUser.onboarding_completed) {
        setActiveTab('onboarding');
      } else if (redirectPath) {
        const dest = redirectPath;
        setRedirectPath(null);
        setActiveTab(dest);
      } else {
        setActiveTab('dashboard');
      }
      return;
    }
  }, [activeTab, currentUser, isLoadingAuth, redirectPath]);

  const handleNavigate = (tab) => {
    if (!currentUser && !publicRoutes.includes(tab)) {
      setRedirectPath(tab);
      setActiveTab('login');
      showToast('Please sign in to access that workspace area.', 'info');
      return;
    }
    setActiveTab(tab);
  };

  return (
    <AppShell activeTab={activeTab} setActiveTab={handleNavigate}>
      {activeTab === 'landing' && (
        <LandingPage
          setActiveTab={handleNavigate}
          setSelectedInnoId={setSelectedInnoId}
        />
      )}

      {activeTab === 'login' && (
        <LoginPage
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'signup' && (
        <SignupPage
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'onboarding' && (
        <OnboardingPage
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'dashboard' && (
        <DashboardPage
          setActiveTab={handleNavigate}
          setSelectedInnoId={setSelectedInnoId}
          setSelectedAssignmentId={setSelectedAssignmentId}
          setExploreFilters={setExploreFilters}
        />
      )}

      {activeTab === 'explore' && (
        <ExplorePage
          setActiveTab={handleNavigate}
          setSelectedInnoId={setSelectedInnoId}
          exploreFilters={exploreFilters}
          setExploreFilters={setExploreFilters}
        />
      )}

      {activeTab === 'community' && (
        <CommunityPage
          setActiveTab={handleNavigate}
          setSelectedInnoId={setSelectedInnoId}
          setSelectedRecipientId={setSelectedRecipientId}
        />
      )}

      {(activeTab === 'insight' || activeTab === 'insights') && (
        <InsightReportPage
          selectedInnoId={selectedInnoId}
          setActiveTab={handleNavigate}
          setSelectedInnoId={setSelectedInnoId}
        />
      )}

      {activeTab === 'submit' && (
        <SubmitInnovationPage
          setActiveTab={handleNavigate}
          setSelectedInnoId={setSelectedInnoId}
          selectedInnoId={selectedInnoId}
        />
      )}

      {activeTab === 'queue' && (
        <ReviewQueuePage
          setActiveTab={handleNavigate}
          setSelectedInnoId={setSelectedInnoId}
          setSelectedAssignmentId={setSelectedAssignmentId}
        />
      )}

      {activeTab === 'review_submit' && (
        <ReviewSubmissionPage
          selectedInnoId={selectedInnoId}
          selectedAssignmentId={selectedAssignmentId}
          setActiveTab={handleNavigate}
          setSelectedInnoId={setSelectedInnoId}
        />
      )}

      {activeTab === 'detail' && (
        <PublishedDetailPage
          selectedInnoId={selectedInnoId}
          setActiveTab={handleNavigate}
          setSelectedInnoId={setSelectedInnoId}
          setSelectedRecipientId={setSelectedRecipientId}
        />
      )}

      {activeTab === 'creator' && (
        <CreatorDashboardPage
          setActiveTab={handleNavigate}
          setSelectedInnoId={setSelectedInnoId}
        />
      )}

      {activeTab === 'profile' && (
        <UserProfilePage />
      )}

      {activeTab === 'settings' && (
        <SettingsPage />
      )}

      {activeTab === 'messages' && (
        <MessagesPage
          setActiveTab={handleNavigate}
          setSelectedInnoId={setSelectedInnoId}
          selectedRecipientId={selectedRecipientId}
          setSelectedRecipientId={setSelectedRecipientId}
        />
      )}

      {activeTab === 'admin' && (
        <AdminDashboardPage
          setActiveTab={handleNavigate}
          setSelectedInnoId={setSelectedInnoId}
        />
      )}

      {/* Global Command Palette & Modals */}
      <CommandPalette
        setActiveTab={handleNavigate}
        setSelectedInnoId={setSelectedInnoId}
        setExploreFilters={setExploreFilters}
      />
      <ApiKeyModal />
      <PersonaSwitcherModal />
    </AppShell>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
