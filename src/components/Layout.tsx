import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { HelpSidebar, HelpPage } from './HelpSidebar';

export const Layout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);
  const [helpPage, setHelpPage] = React.useState<HelpPage>('scheduling');

  const openHelp = (page: HelpPage) => {
    setHelpPage(page);
    setIsHelpOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      <main className="flex-1 p-8 overflow-y-auto transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <Header />
          <Outlet context={{ openHelp }} />
        </div>
      </main>
      <HelpSidebar 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
        page={helpPage} 
      />
    </div>
  );
};
