import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import NetworkGraph from '@/components/NetworkGraph';
import QueryInterface from '@/components/QueryInterface';
import Analytics from './Analytics';
import Processes from './Processes';
import Dashboard from './Dashboard';
import Employees from './Employees';
import DataHub from './DataHub';
import Settings from './Settings';
import Notifications from './Notifications';
import Profile from './Profile';

const Index = () => {
  const location = useLocation();
  const [activeView, setActiveView] = useState('dashboard');

  // Handle navigation state from other pages (e.g., back from employee profile)
  useEffect(() => {
    if (location.state?.view) {
      setActiveView(location.state.view);
    }
  }, [location.state]);

  const renderMainContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveView} />;
      case 'process-map':
        return (
          <div className="flex-1 flex flex-col h-full">
            <div className="flex-1">
              <NetworkGraph />
            </div>
            <div className="flex-shrink-0">
              <QueryInterface />
            </div>
          </div>
        );
      case 'employees':
        return <Employees />;
      case 'processes':
        return <Processes />;
      case 'analytics':
        return <Analytics />;
      case 'data-hub':
        return <DataHub />;
      case 'settings':
        return <Settings />;
      case 'notifications':
        return <Notifications />;
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
