import React from 'react';
import { renderToString } from 'react-dom/server';
import { AuthProvider } from '../src/context/AuthContext.jsx';
import { StorageService } from '../src/services/storage.js';

// Setup Mock DOM/Global
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};
global.window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  matchMedia: () => ({ matches: false }),
  location: { hash: '', search: '', pathname: '/' },
  history: { replaceState: () => {} },
  scrollTo: () => {}
};
global.document = {
  documentElement: {
    setAttribute: () => {},
    getAttribute: () => 'dark'
  }
};

StorageService.init();

async function testRenderPages() {
  const pages = [
    { name: 'LandingPage', file: '../src/pages/LandingPage.jsx', props: { setActiveTab: () => {}, setSelectedInnoId: () => {} } },
    { name: 'LoginPage', file: '../src/pages/LoginPage.jsx', props: { setActiveTab: () => {} } },
    { name: 'SignupPage', file: '../src/pages/SignupPage.jsx', props: { setActiveTab: () => {} } },
    { name: 'OnboardingPage', file: '../src/pages/OnboardingPage.jsx', props: { setActiveTab: () => {} } },
    { name: 'DashboardPage', file: '../src/pages/DashboardPage.jsx', props: { setActiveTab: () => {}, setSelectedInnoId: () => {}, setSelectedAssignmentId: () => {}, setExploreFilters: () => {} } },
    { name: 'ExplorePage', file: '../src/pages/ExplorePage.jsx', props: { setActiveTab: () => {}, setSelectedInnoId: () => {}, exploreFilters: { search: '', category: 'ALL' }, setExploreFilters: () => {} } },
    { name: 'SubmitInnovationPage', file: '../src/pages/SubmitInnovationPage.jsx', props: { setActiveTab: () => {}, setSelectedInnoId: () => {}, selectedInnoId: null } },
    { name: 'ReviewQueuePage', file: '../src/pages/ReviewQueuePage.jsx', props: { setActiveTab: () => {}, setSelectedInnoId: () => {}, setSelectedAssignmentId: () => {} } },
    { name: 'ReviewSubmissionPage', file: '../src/pages/ReviewSubmissionPage.jsx', props: { selectedInnoId: 'proj_studyflow', selectedAssignmentId: null, setActiveTab: () => {}, setSelectedInnoId: () => {} } },
    { name: 'PublishedDetailPage', file: '../src/pages/PublishedDetailPage.jsx', props: { selectedInnoId: 'proj_studyflow', setActiveTab: () => {}, setSelectedInnoId: () => {}, setSelectedRecipientId: () => {}, setViewUserId: () => {} } },
    { name: 'CreatorDashboardPage', file: '../src/pages/CreatorDashboardPage.jsx', props: { setActiveTab: () => {}, setSelectedInnoId: () => {} } },
    { name: 'UserProfilePage', file: '../src/pages/UserProfilePage.jsx', props: { viewUserId: null, setViewUserId: () => {}, setActiveTab: () => {}, setSelectedInnoId: () => {}, setSelectedRecipientId: () => {} } },
    { name: 'SettingsPage', file: '../src/pages/SettingsPage.jsx', props: {} },
    { name: 'AdminDashboardPage', file: '../src/pages/AdminDashboardPage.jsx', props: { setActiveTab: () => {}, setSelectedInnoId: () => {} } },
    { name: 'CommunityPage', file: '../src/pages/CommunityPage.jsx', props: { setActiveTab: () => {}, setSelectedInnoId: () => {}, setSelectedRecipientId: () => {}, setViewUserId: () => {} } },
    { name: 'AIResearchPage', file: '../src/pages/AIResearchPage.jsx', props: { setActiveTab: () => {}, setSelectedInnoId: () => {}, initialProjectId: null } },
    { name: 'InsightsPage', file: '../src/pages/InsightsPage.jsx', props: { setActiveTab: () => {}, setSelectedInnoId: () => {}, selectedInnoId: 'proj_studyflow' } },
    { name: 'InsightReportPage', file: '../src/pages/InsightReportPage.jsx', props: { selectedInnoId: 'proj_studyflow', setActiveTab: () => {}, setSelectedInnoId: () => {} } },
    { name: 'MessagesPage', file: '../src/pages/MessagesPage.jsx', props: { setActiveTab: () => {}, setSelectedInnoId: () => {}, selectedRecipientId: null, setSelectedRecipientId: () => {}, setViewUserId: () => {} } }
  ];

  console.log('Testing React SSR Rendering of all 19 pages:\n');

  for (const p of pages) {
    try {
      const module = await import(p.file);
      const Component = module.default;
      const html = renderToString(
        React.createElement(AuthProvider, null,
          React.createElement(Component, p.props)
        )
      );
      console.log(`✓ [SUCCESS] ${p.name.padEnd(25)} rendered (${html.length} chars)`);
    } catch (err) {
      console.error(`✗ [ERROR]   ${p.name.padEnd(25)} failed: ${err.message}\n${err.stack}`);
    }
  }
}

testRenderPages();
