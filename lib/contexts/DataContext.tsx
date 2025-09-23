"use client";

import React, { createContext, useContext } from 'react';
import { useDashboardStats, useProfileData, useRecentChats } from '@/lib/hooks/useApi';

interface DataContextType {
  dashboardStats: any;
  profileData: any;
  recentChats: any;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType>({
  dashboardStats: null,
  profileData: null,
  recentChats: null,
  isLoading: true
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { data: dashboardStats, isLoading: dashboardLoading } = useDashboardStats();
  const { data: profileData, isLoading: profileLoading } = useProfileData();
  const { data: recentChats, isLoading: chatsLoading } = useRecentChats();

  const isLoading = dashboardLoading || profileLoading || chatsLoading;

  return (
    <DataContext.Provider value={{
      dashboardStats,
      profileData,
      recentChats,
      isLoading
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useDataContext = () => useContext(DataContext);