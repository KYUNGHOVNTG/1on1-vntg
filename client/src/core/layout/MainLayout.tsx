/**
 * MainLayout Component
 *
 * 메인 레이아웃 - Header, Sidebar, Content 영역 구성
 *
 * @example
 * <MainLayout>
 *   <YourPageComponent />
 * </MainLayout>
 */

import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Content Container */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>
    </div>
  );
};
