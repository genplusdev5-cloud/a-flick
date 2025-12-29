import { z } from 'zod'
import { requiredString } from './common'

export const chemicalsSchema = z.object({
  name: requiredString('Chemical Name'),

  unit: z.string().optional(),
  
  dosage: z.string().optional(), // 'unit_value' in payload
  
  ingredients: z.string().optional(), // 'description' in payload

  // File is handled separately as FormData usually, 
  // but if we keep file name in state:
  file: z.any().optional(),

  status: z.number().optional()
})
