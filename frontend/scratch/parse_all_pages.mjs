import fs from 'fs';
import * as babelParser from '@babel/parser';

const pages = [
  'AdminDashboardPage.jsx',
  'AIResearchPage.jsx',
  'CommunityPage.jsx',
  'CreatorDashboardPage.jsx',
  'DashboardPage.jsx',
  'ExplorePage.jsx',
  'InsightReportPage.jsx',
  'InsightsPage.jsx',
  'LandingPage.jsx',
  'LoginPage.jsx',
  'MessagesPage.jsx',
  'OnboardingPage.jsx',
  'PublishedDetailPage.jsx',
  'ReviewQueuePage.jsx',
  'ReviewSubmissionPage.jsx',
  'SettingsPage.jsx',
  'SignupPage.jsx',
  'SubmitInnovationPage.jsx',
  'UserProfilePage.jsx'
];

pages.forEach(p => {
  const code = fs.readFileSync(`./src/pages/${p}`, 'utf8');
  try {
    babelParser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });
    console.log(`✓ ${p.padEnd(28)} parsed successfully`);
  } catch (err) {
    console.error(`✗ ${p.padEnd(28)} parse error: ${err.message}`);
  }
});
