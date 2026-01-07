import useSWR, { mutate as globalMutate } from 'swr'
import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/hooks/useSupabase'
import { CollectionWithCount } from '@/lib/types/database'
import {
  fetchCollections,
  fetchCollectionPapers,
  fetchPaperCollections,
} from '@/lib/api/collections'
import { Paper } from '@/lib/hooks/useApi'

const supabase = getSupabaseClient()

// Cache key prefixes
const COLLECTIONS_KEY_PREFIX = 'collections'
const COLLECTION_PAPERS_KEY_PREFIX = 'collection-papers'
const PAPER_COLLECTIONS_KEY_PREFIX = 'paper-collections'

// Fetchers
const collectionsFetcher = async (key: string): Promise<CollectionWithCount[]> => {
  // key format: "collections|userId"
  return fetchCollections()
}

const collectionPapersFetcher = async (key: string): Promise<Paper[]> => {
  // key format: "collection-papers|collectionId"
  const collectionId = key.split('|')[1]
  return fetchCollectionPapers(collectionId) as Promise<Paper[]>
}

const paperCollectionsFetcher = async (key: string): Promise<CollectionWithCount[]> => {
  // key format: "paper-collections|paperId"
  const paperId = key.split('|')[1]
  return fetchPaperCollections(paperId)
}

// Hook to fetch all user's collections with counts
export function useCollections() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUser()
  }, [])

  const result = useSWR<CollectionWithCount[]>(
    userId ? `${COLLECTIONS_KEY_PREFIX}|${userId}` : null,
    collectionsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 60000, // 1 minute
      onError: (error) => {
        if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
          setUserId(null)
        }
      }
    }
  )

  return {
    ...result,
    // Helper to refresh collections
    refresh: () => {
      if (userId) {
        result.mutate()
      }
    },
  }
}

// Hook to fetch papers in a specific collection
export function useCollectionPapers(collectionId: string | null) {
  const result = useSWR<Paper[]>(
    collectionId ? `${COLLECTION_PAPERS_KEY_PREFIX}|${collectionId}` : null,
    collectionPapersFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 30000, // 30 seconds
    }
  )

  return {
    ...result,
    refresh: () => {
      if (collectionId) {
        result.mutate()
      }
    },
  }
}

// Hook to fetch collections a paper belongs to
export function usePaperCollections(paperId: string | null) {
  const result = useSWR<CollectionWithCount[]>(
    paperId ? `${PAPER_COLLECTIONS_KEY_PREFIX}|${paperId}` : null,
    paperCollectionsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 30000, // 30 seconds
    }
  )

  return {
    ...result,
    refresh: () => {
      if (paperId) {
        result.mutate()
      }
    },
  }
}

// Utility function to invalidate all collection-related caches
export function invalidateCollectionCaches() {
  // This will cause all SWR hooks with these prefixes to refetch
  globalMutate((key: string) =>
    typeof key === 'string' && (
      key.startsWith(COLLECTIONS_KEY_PREFIX) ||
      key.startsWith(COLLECTION_PAPERS_KEY_PREFIX) ||
      key.startsWith(PAPER_COLLECTIONS_KEY_PREFIX)
    ),
    undefined,
    { revalidate: true }
  )
}

// Utility function to invalidate collection papers cache for a specific collection
export function invalidateCollectionPapers(collectionId: string) {
  globalMutate(`${COLLECTION_PAPERS_KEY_PREFIX}|${collectionId}`)
}

// Utility function to invalidate paper collections cache for a specific paper
export function invalidatePaperCollections(paperId: string) {
  globalMutate(`${PAPER_COLLECTIONS_KEY_PREFIX}|${paperId}`)
}
