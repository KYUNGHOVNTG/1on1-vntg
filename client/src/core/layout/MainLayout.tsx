/**
 * MainLayout Component
 *
 * Sidebar-centric 메인 레이아웃 (2026 SaaS 트렌드)
 * - Border-less 디자인
 * - 전체 높이 사이드바
 * - 연한 회색 배경
 *
 * @example
 * <MainLayout>
 *   <YourPageComponent />
 * </MainLayout>
 */

import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For Mobile
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // For Desktop

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={() => setIsSidebarOpen(false)}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header (햄버거 메뉴만) */}
        <div className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 h-16 flex items-center">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
