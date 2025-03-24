'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FiSettings, FiMap, FiKey } from 'react-icons/fi';

const settingsItems = [
  { name: 'Navigation', href: '/settings/navigation', icon: FiMap },
  { name: 'Google', href: '/settings/google', icon: FiKey },
];

export default function SettingsPage() {
  const pathname = usePathname();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-dog-gray mb-6">Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`p-6 rounded-lg border transition-colors ${
                isActive
                  ? 'bg-primary-50 border-primary-200'
                  : 'bg-white border-secondary-200 hover:border-primary-200'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${
                  isActive ? 'bg-primary-100' : 'bg-secondary-50'
                }`}>
                  <item.icon className={`h-6 w-6 ${
                    isActive ? 'text-primary-600' : 'text-secondary-600'
                  }`} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-dog-gray">{item.name}</h2>
                  <p className="text-sm text-secondary-600">
                    Configure {item.name.toLowerCase()} settings
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
} 