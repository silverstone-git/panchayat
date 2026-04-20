import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'; 

import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';

import { AuthScreen } from './components/auth/AuthScreen';
import { Header } from './components/layout/Header';

import { HomeFeedPage } from './pages/HomeFeedPage';
import { IdeaDiscussionPage } from './pages/IdeaDiscussionPage';
import { CrowdfundingGroupsPage } from './pages/CrowdfundingGroupsPage';
import { ImpactResumePage } from './pages/ImpactResumePage';
import { ExpertReviewPanelPage } from './pages/ExpertReviewPanelPage';
import { SubpanchayatsDirectoryPage } from './pages/SubpanchayatsDirectoryPage';
import { ModerationDashboardPage } from './pages/ModerationDashboardPage';
import { ToasterContainer } from './components/common/ToasterContainer';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { token, isLoggedIn, profile, handleAuthSuccess, handleLogout, updateAvatar } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');

  if (!isLoggedIn || !token) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <BrowserRouter>
      <ToasterContainer />
      <div className="bg-surface text-on-surface min-h-screen font-body">
        <Header 
          theme={theme} 
          toggleTheme={toggleTheme} 
          profile={profile} 
          handleLogout={handleLogout}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleCategoryChange={() => {}}
        />

        <Routes>
          <Route path="/" element={<HomeFeedPage token={token} profile={profile} updateAvatar={updateAvatar} searchQuery={searchQuery} />} />
          <Route path="/idea/:id" element={<IdeaDiscussionPage token={token} />} />
          <Route path="/groups" element={<SubpanchayatsDirectoryPage token={token} />} />
          <Route path="/funds" element={<CrowdfundingGroupsPage token={token} />} />
          <Route path="/impact" element={<ImpactResumePage profile={profile} token={token} />} />
          <Route path="/expert-review" element={<ExpertReviewPanelPage token={token} />} />
          <Route path="/moderation" element={<ModerationDashboardPage token={token} profile={profile} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
