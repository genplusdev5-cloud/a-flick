import { z } from 'zod'
import { requiredString } from './common'

export const callTypeSchema = z.object({
  name: requiredString('Call Type Name'),

  sortOrder: z.string()
    .refine(val => !isNaN(val), 'Must be a number')
    .optional()
    .or(z.literal('')),

  description: z.string().optional(),

  status: z.number().optional()
})
