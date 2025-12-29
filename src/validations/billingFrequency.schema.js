import { z } from 'zod'
import { requiredString } from './common'

export const billingFrequencySchema = z.object({
  billingFrequency: requiredString('Billing Frequency'),
  
  incrementType: z.string().optional(),
  
  noOfIncrements: z.string().optional(),
  
  backlogAge: z.string().optional(),
  
  frequencyCode: z.string().optional(),
  
  sortOrder: z.string()
    .refine(val => !isNaN(val), 'Must be a number')
    .optional()
    .or(z.literal('')),

  description: z.string().optional(),

  status: z.number().optional()
})
