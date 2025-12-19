"use client";

import React, { createContext, useContext } from 'react';
import { useDashboardStats, useProfileData, usePapers, useRecentReads, Paper } from '@/lib/hooks/useApi';

interface DataContextType {
  dashboardStats: any;
  profileData: any;
  papers: Paper[] | undefined;
  recentReads: Paper[] | undefined;
  isLoading: boolean;
  refreshPapers: () => void;
  refreshRecentReads: () => void;
}

const DataContext = createContext<DataContextType>({
  dashboardStats: null,
  profileData: null,
  papers: undefined,
  recentReads: undefined,
  isLoading: true,
  refreshPapers: () => {},
  refreshRecentReads: () => {}
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { data: dashboardStats, isLoading: dashboardLoading } = useDashboardStats();
  const { data: profileData, isLoading: profileLoading } = useProfileData();
  const { data: papers, isLoading: papersLoading, mutate: mutatePapers } = usePapers();
  const { data: recentReads, isLoading: recentReadsLoading, mutate: mutateRecentReads } = useRecentReads();

  const isLoading = dashboardLoading || profileLoading || papersLoading || recentReadsLoading;

  const refreshPapers = () => {
    mutatePapers();
  };

  const refreshRecentReads = () => {
    mutateRecentReads();
  };

  return (
    <DataContext.Provider value={{
      dashboardStats,
      profileData,
      papers,
      recentReads,
      isLoading,
      refreshPapers,
      refreshRecentReads
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useDataContext = () => useContext(DataContext);

export const useData = () => {
  const context = useContext(DataContext);
  return {
    papers: context.papers,
    recentReads: context.recentReads,
    refreshPapers: context.refreshPapers,
    refreshRecentReads: context.refreshRecentReads
  };
};