import React, { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Dashboard from './Dashboard';
import Profile from './Profile';
import Interview from './Interview';

const Index = () => {
  const [activeView, setActiveView] = useState('dashboard');

  const renderMainContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveView} />;
      case 'interview':
        return <Interview onNavigate={setActiveView} />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="min-h-screen bg-background w-full">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <div className="ml-64 min-h-screen">
        <Header onNavigate={setActiveView} />
        <main className="pt-16 p-6">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
