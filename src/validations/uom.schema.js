import { z } from 'zod'
import { requiredString } from './common'

export const uomSchema = z.object({
  name: requiredString('UOM Name'),

  uomStore: z.string().optional(),
  uomPurchase: z.string().optional(),
  
  conversion: z.string()
    .refine(val => !isNaN(val), 'Must be a number')
    .optional()
    .or(z.literal('')),

  description: z.string().optional(),

  status: z.number().optional()
})
