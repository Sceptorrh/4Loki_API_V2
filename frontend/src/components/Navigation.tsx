'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  FiHome, 
  FiCalendar, 
  FiUsers, 
  FiTarget, 
  FiFileText, 
  FiBarChart2, 
  FiBell,
  FiMenu,
  FiX
} from 'react-icons/fi';

const navItems = [
  { name: 'Dashboard', href: '/', icon: FiHome },
  { 
    name: 'Appointments', 
    href: '/appointments', 
    icon: FiCalendar,
    subItems: [
      { name: 'Invoice Ready', href: '/appointments/invoice-ready' }
    ]
  },
  { name: 'Customers', href: '/customers', icon: FiUsers },
  { name: 'Dogs', href: '/dogs', icon: FiTarget },
  { name: 'Invoices', href: '/invoices', icon: FiFileText },
  { name: 'Reports', href: '/reports', icon: FiBarChart2 },
];

export default function Navigation() {
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
        <div className="p-4 flex items-center justify-center h-24">
          <Link href="/" className="relative">
            {/* Small logo for collapsed sidebar */}
            <div className="hidden md:block group-hover:hidden w-16 h-16 relative">
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
            <div className="hidden md:group-hover:block w-56 h-16 relative">
              <div className="absolute inset-0 bg-primary-100 rounded-lg flex items-center p-2">
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
            
            {/* Mobile logo */}
            <div className="md:hidden w-56 h-16 relative">
              <div className="absolute inset-0 bg-primary-100 rounded-lg flex items-center p-2">
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
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-2 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const hasSubItems = item.subItems && item.subItems.length > 0;
              
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
                  
                  {/* Sub-items */}
                  {hasSubItems && (
                    <ul className="mt-1 ml-6 space-y-1">
                      {item.subItems.map((subItem) => {
                        const isSubActive = pathname === subItem.href;
                        return (
                          <li key={subItem.name}>
                            <Link
                              href={subItem.href}
                              className={`flex items-center px-2 py-1.5 text-sm rounded-md ${
                                isSubActive
                                  ? 'bg-primary-50 text-dog-lightgray'
                                  : 'text-dog-gray hover:bg-secondary-100 hover:text-dog-lightgray'
                              }`}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <span className="ml-1 whitespace-nowrap md:hidden md:group-hover:block">{subItem.name}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Notification Icon at Bottom */}
        <div className="p-4 border-t border-secondary-100">
          <button
            type="button"
            className="w-full flex items-center justify-center md:group-hover:justify-start text-dog-gray hover:text-dog-lightgray focus:outline-none rounded-lg p-2 hover:bg-secondary-100"
          >
            <FiBell className="h-5 w-5" />
            <span className="ml-3 md:hidden md:group-hover:block font-medium">Notifications</span>
          </button>
        </div>
      </aside>
    </>
  );
} 