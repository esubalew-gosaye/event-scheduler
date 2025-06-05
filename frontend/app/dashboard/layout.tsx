import type React from 'react';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <DashboardNav />
        <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
