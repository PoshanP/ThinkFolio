"use client";

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

interface SWRProviderProps {
  children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Enable cache persistence
        provider: () => new Map(),

        // Keep data fresh but prevent unnecessary revalidation
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        revalidateIfStale: false,

        // Cache data for 5 minutes
        dedupingInterval: 300000,

        // Keep previous data while revalidating
        keepPreviousData: true,

        // Retry on error
        shouldRetryOnError: true,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
