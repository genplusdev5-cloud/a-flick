import { z } from 'zod'
import { requiredString } from './common'

export const taxSchema = z.object({
  name: requiredString('Tax Name'),

  tax_value: z
    .string()
    .min(1, 'Tax Value is required')
    .refine(val => !isNaN(val), 'Tax Value must be a number')
    .refine(val => Number(val) > 0, 'Tax Value must be greater than 0')
    .refine(val => Number(val) <= 100, 'Tax Value cannot exceed 100'),

  description: z.string().optional(),

  status: z.number().optional()
})
