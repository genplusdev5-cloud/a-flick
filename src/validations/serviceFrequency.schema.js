import { z } from 'zod'
import { requiredString } from './common'

export const serviceFrequencySchema = z.object({
  serviceFrequency: requiredString('Service Frequency'), // mapped to 'name' in payload
  
  incrementType: z.string().optional(), // Not strictly checked in handleSave

  noOfIncrements: z.string()
    .refine(val => !isNaN(val) && Number(val) > 0, 'Must be a positive number')
    .optional()
    .or(z.literal('')), 
    // In original code, it's just text. But usually 'No Of Increments' implies number.
    // Let's assume strict validation isn't forced unless typed, 
    // BUT Tax page forced numbers for tax_value. 
    // Let's make it refine number if it's meant to be numeric.
    // 'noOfIncrements' seems essential for logic. 
    // Let's use requiredString if it was required in UI. 
    // UI had no 'required' prop visible on quick glance? 
    // Wait, let's stick to base requirements: Name is always required.
  
  backlogAge: z.string().optional(),
  
  frequencyCode: z.string().optional(),
  
  displayFrequency: z.string().optional(),
  
  sortOrder: z.string()
    .refine(val => !isNaN(val), 'Must be a number')
    .optional()
    .or(z.literal('')),

  description: z.string().optional(),

  status: z.number().optional()
})
