import { z } from 'zod'
import { requiredString } from './common'

export const chemicalsSchema = z.object({
  name: requiredString('Chemical Name'),

  unit: z.string().optional(),

  conversion_value: z.string().optional(),

  ingredients: z.string().optional(), // 'description' in payload

  store_unit: z.string().optional(),

  unit_rate: z.string().optional(),

  // File is handled separately as FormData usually,
  // but if we keep file name in state:
  file: z.any().optional(),

  status: z.number().optional()
})
