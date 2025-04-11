'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  FiHome, 
  FiCalendar, 
  FiUsers, 
  FiTarget, 
  FiFileText, 
  FiBarChart2, 
  FiMenu,
  FiX,
  FiDownload,
  FiSettings,
  FiClock,
  FiSearch
} from 'react-icons/fi';
import UserProfile from './UserProfile';

const navItems = [
  { name: 'Dashboard', href: '/', icon: FiHome },
  { name: 'Appointments', href: '/appointments', icon: FiCalendar },
  { name: 'Invoice Ready', href: '/appointments/invoice-ready', icon: FiFileText },
  { name: 'Hours', href: '/hours', icon: FiClock },
  { name: 'Customers', href: '/customers', icon: FiUsers },
  { name: 'Dogs', href: '/dogs', icon: FiTarget },
  { name: 'AI Search', href: '/ai-search', icon: FiSearch },
  { name: 'Exports', href: '/exports', icon: FiDownload },
  { name: 'Settings', href: '/settings', icon: FiSettings }
];

// This component is now only for the site navigation sidebar
const Navigation: React.FC = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Toggle Button - Only visible on small screens */}
      <button
        type="button"
        className="md:hidden fixed top-4 left-4 z-20 p-2 rounded-md bg-white shadow-md text-dog-lightgray"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <FiX className="h-6 w-6" />
        ) : (
          <FiMenu className="h-6 w-6" />
        )}
      </button>

      {/* Sidebar Navigation */}
      <aside 
        className={`bg-secondary-50 shadow-md h-screen fixed left-0 top-0 flex flex-col z-10 transition-all duration-300
          ${isMobileMenuOpen ? 'w-64' : 'w-0 md:w-20'} 
          md:hover:w-64 group`}
      >
        {/* Logo */}
        <div className="p-2 relative z-20 mb-8">
          <Link href="/" className="relative block">
            {/* Small logo for collapsed sidebar */}
            <div className={`${isMobileMenuOpen ? 'hidden' : ''} md:block md:group-hover:hidden w-16 h-16 flex items-center justify-center`}>
              <Image
                src="/images/Logo-small.png"
                alt="4Loki Logo"
                width={64}
                height={64}
                className="object-contain"
                priority
              />
            </div>
            
            {/* Full logo for expanded sidebar */}
            <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden md:group-hover:block w-56 h-16`}>
              <div className="bg-primary-100 rounded-lg flex items-center p-2">
                <Image
                  src="/images/Logo-wide.png"
                  alt="4Loki Logo"
                  width={200}
                  height={48}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </Link>
        </div>
        
        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto relative z-10">
          <ul className="space-y-2 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`sidebar-nav-item rounded-lg ${
                      isActive
                        ? 'bg-primary-100 text-dog-lightgray border-l-4 border-dog-gray'
                        : 'text-dog-gray hover:bg-secondary-100 hover:text-dog-lightgray'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="ml-3 whitespace-nowrap md:hidden md:group-hover:block font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto border-t border-secondary-100">
          {/* User Profile */}
          <div className="p-4">
            <div className={`${isMobileMenuOpen ? 'hidden' : ''} md:block md:group-hover:hidden`}>
              <UserProfile isCollapsed={true} />
            </div>
            <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden md:group-hover:block`}>
              <UserProfile isCollapsed={false} />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Navigation; 