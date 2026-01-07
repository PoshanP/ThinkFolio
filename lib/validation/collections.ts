import { z } from 'zod'
import { COLLECTION_COLORS, COLLECTION_ICONS } from '@/lib/constants'

// Extract valid color and icon values
const validColors = COLLECTION_COLORS.map(c => c.value) as [string, ...string[]]
const validIcons = [...COLLECTION_ICONS] as [string, ...string[]]

// Schema for creating a new collection
export const CreateCollectionSchema = z.object({
  name: z
    .string()
    .min(1, 'Collection name is required')
    .max(100, 'Collection name must be 100 characters or less')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .trim()
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .refine((val) => validColors.includes(val), 'Invalid color')
    .optional(),
  icon: z
    .string()
    .refine((val) => validIcons.includes(val), 'Invalid icon')
    .optional(),
})

// Schema for updating a collection
export const UpdateCollectionSchema = z.object({
  name: z
    .string()
    .min(1, 'Collection name is required')
    .max(100, 'Collection name must be 100 characters or less')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .trim()
    .optional()
    .nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .refine((val) => validColors.includes(val), 'Invalid color')
    .optional(),
  icon: z
    .string()
    .refine((val) => validIcons.includes(val), 'Invalid icon')
    .optional(),
  display_order: z
    .number()
    .int()
    .min(0)
    .optional(),
})

// Schema for adding papers to a collection
export const AddPapersToCollectionSchema = z.object({
  paperIds: z
    .array(z.string().uuid('Invalid paper ID'))
    .min(1, 'At least one paper ID is required')
    .max(100, 'Cannot add more than 100 papers at once'),
})

// Schema for updating a paper's collection assignments
export const UpdatePaperCollectionsSchema = z.object({
  collectionIds: z
    .array(z.string().uuid('Invalid collection ID'))
    .max(50, 'A paper cannot belong to more than 50 collections'),
})

// Type exports
export type CreateCollectionInput = z.infer<typeof CreateCollectionSchema>
export type UpdateCollectionInput = z.infer<typeof UpdateCollectionSchema>
export type AddPapersToCollectionInput = z.infer<typeof AddPapersToCollectionSchema>
export type UpdatePaperCollectionsInput = z.infer<typeof UpdatePaperCollectionsSchema>
