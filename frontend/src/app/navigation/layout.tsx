import React from 'react';
import { Toaster } from 'react-hot-toast';

export default function NavigationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Toaster position="top-right" />
      {children}
    </div>
  );
} 