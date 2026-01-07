import { API_ROUTES } from '@/lib/constants'
import { CollectionWithCount } from '@/lib/types/database'
import { CreateCollectionInput, UpdateCollectionInput } from '@/lib/validation/collections'

interface ApiResponse<T> {
  data?: T
  error?: string
  code?: number
}

async function handleResponse<T>(response: Response): Promise<T> {
  const json: ApiResponse<T> = await response.json()

  if (!response.ok || json.error) {
    throw new Error(json.error || 'An error occurred')
  }

  return json.data as T
}

// Fetch all collections
export async function fetchCollections(): Promise<CollectionWithCount[]> {
  const response = await fetch(API_ROUTES.COLLECTIONS.LIST, {
    credentials: 'include',
  })
  return handleResponse<CollectionWithCount[]>(response)
}

// Create a new collection
export async function createCollection(data: CreateCollectionInput): Promise<CollectionWithCount> {
  const response = await fetch(API_ROUTES.COLLECTIONS.CREATE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return handleResponse<CollectionWithCount>(response)
}

// Update a collection
export async function updateCollection(
  id: string,
  data: UpdateCollectionInput
): Promise<CollectionWithCount> {
  const response = await fetch(API_ROUTES.COLLECTIONS.UPDATE(id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  return handleResponse<CollectionWithCount>(response)
}

// Delete a collection
export async function deleteCollection(id: string): Promise<{ message: string }> {
  const response = await fetch(API_ROUTES.COLLECTIONS.DELETE(id), {
    method: 'DELETE',
    credentials: 'include',
  })
  return handleResponse<{ message: string }>(response)
}

// Fetch papers in a collection
export async function fetchCollectionPapers(collectionId: string): Promise<unknown[]> {
  const response = await fetch(API_ROUTES.COLLECTIONS.PAPERS(collectionId), {
    credentials: 'include',
  })
  return handleResponse<unknown[]>(response)
}

// Add papers to a collection
export async function addPapersToCollection(
  collectionId: string,
  paperIds: string[]
): Promise<{ message: string }> {
  const response = await fetch(API_ROUTES.COLLECTIONS.PAPERS(collectionId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ paperIds }),
  })
  return handleResponse<{ message: string }>(response)
}

// Remove a paper from a collection
export async function removePaperFromCollection(
  collectionId: string,
  paperId: string
): Promise<{ message: string }> {
  const response = await fetch(API_ROUTES.COLLECTIONS.REMOVE_PAPER(collectionId, paperId), {
    method: 'DELETE',
    credentials: 'include',
  })
  return handleResponse<{ message: string }>(response)
}

// Fetch collections a paper belongs to
export async function fetchPaperCollections(paperId: string): Promise<CollectionWithCount[]> {
  const response = await fetch(API_ROUTES.PAPERS.COLLECTIONS(paperId), {
    credentials: 'include',
  })
  return handleResponse<CollectionWithCount[]>(response)
}

// Update all collection assignments for a paper
export async function updatePaperCollections(
  paperId: string,
  collectionIds: string[]
): Promise<{ message: string }> {
  const response = await fetch(API_ROUTES.PAPERS.COLLECTIONS(paperId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ collectionIds }),
  })
  return handleResponse<{ message: string }>(response)
}
