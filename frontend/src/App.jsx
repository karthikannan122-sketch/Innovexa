import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import AppShell from './components/AppShell';
import CommandPalette from './components/CommandPalette';
import ApiKeyModal from './components/ApiKeyModal';
import PersonaSwitcherModal from './components/PersonaSwitcherModal';

// High-Performance Dynamic Code-Splitting: Lazy load all pages on demand
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const SubmitInnovationPage = lazy(() => import('./pages/SubmitInnovationPage'));
const ReviewQueuePage = lazy(() => import('./pages/ReviewQueuePage'));
const ReviewSubmissionPage = lazy(() => import('./pages/ReviewSubmissionPage'));
const InsightReportPage = lazy(() => import('./pages/InsightReportPage'));
const PublishedDetailPage = lazy(() => import('./pages/PublishedDetailPage'));
const CreatorDashboardPage = lazy(() => import('./pages/CreatorDashboardPage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const AIResearchPage = lazy(() => import('./pages/AIResearchPage'));

function PageLoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '55vh',
      gap: '14px',
      color: 'var(--text-secondary, #94a3b8)',
      fontFamily: 'inherit'
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: '3px solid rgba(99, 102, 241, 0.15)',
        borderTopColor: 'var(--coral, #f97316)',
        animation: 'innovexa-spin 0.7s linear infinite'
      }} />
      <div style={{
        fontSize: '0.82rem',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontWeight: 600,
        color: 'var(--text-muted, #64748b)'
      }}>
        Loading Workspace...
      </div>
      <style>{`
        @keyframes innovexa-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function AppContent() {
  const { currentUser, isLoadingAuth, redirectPath, setRedirectPath, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState('landing');
  const [selectedInnoId, setSelectedInnoId] = useState(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [selectedRecipientId, setSelectedRecipientId] = useState(null);
  const [viewUserId, setViewUserId] = useState(null);
  const [exploreFilters, setExploreFilters] = useState({ search: '', category: 'ALL' });

  // Public & Protected Routes
  const publicRoutes = ['landing', 'login', 'signup', 'onboarding', 'explore', 'community', 'insights', 'insight', 'detail', 'research', 'profile'];

  useEffect(() => {
    if (isLoadingAuth) return; // Wait for initial Supabase session resolution

    // If unauthenticated visitor attempts to access protected routes
    if (!currentUser && !publicRoutes.includes(activeTab)) {
      setRedirectPath(activeTab);
      setActiveTab('login');
      if (typeof showToast === 'function') {
        showToast('Please sign in to access that workspace area.', 'info');
      }
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

    // If authenticated user has completed onboarding but is still on the onboarding tab, advance to dashboard
    if (currentUser && currentUser.onboarding_completed && activeTab === 'onboarding') {
      if (redirectPath) {
        const dest = redirectPath;
        setRedirectPath(null);
        setActiveTab(dest);
      } else {
        setActiveTab('dashboard');
      }
      return;
    }
  }, [activeTab, currentUser, isLoadingAuth, redirectPath]);

  const handleNavigate = (tab, targetUserId) => {
    if (targetUserId !== undefined) {
      setViewUserId(targetUserId);
    } else if (tab === 'profile') {
      setViewUserId(null); // Reset to personal profile when clicking profile directly
    }

    if (!currentUser && !publicRoutes.includes(tab)) {
      setRedirectPath(tab);
      setActiveTab('login');
      if (typeof showToast === 'function') {
        showToast('Please sign in to access that workspace area.', 'info');
      }
      return;
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppShell activeTab={activeTab} setActiveTab={handleNavigate}>
      <Suspense fallback={<PageLoadingFallback />}>
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
            setViewUserId={setViewUserId}
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
            setViewUserId={setViewUserId}
          />
        )}

        {activeTab === 'creator' && (
          <CreatorDashboardPage
            setActiveTab={handleNavigate}
            setSelectedInnoId={setSelectedInnoId}
          />
        )}

        {activeTab === 'profile' && (
          <UserProfilePage
            viewUserId={viewUserId}
            setViewUserId={setViewUserId}
            setActiveTab={handleNavigate}
            setSelectedInnoId={setSelectedInnoId}
            setSelectedRecipientId={setSelectedRecipientId}
          />
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
            setViewUserId={setViewUserId}
          />
        )}

        {activeTab === 'research' && (
          <AIResearchPage
            setActiveTab={handleNavigate}
            setSelectedInnoId={setSelectedInnoId}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboardPage
            setActiveTab={handleNavigate}
            setSelectedInnoId={setSelectedInnoId}
          />
        )}
      </Suspense>

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

