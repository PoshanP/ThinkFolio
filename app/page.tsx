"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { LandingPage } from "@/frontend/components/LandingPage";
import { Dashboard } from "@/frontend/components/Dashboard";

export default function Home() {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!user) {
    return <LandingPage />;
  }

  // Show dashboard for authenticated users
  return <Dashboard />;
}
