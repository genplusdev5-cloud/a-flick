import { z } from 'zod'
import { requiredString } from './common'

export const industrySchema = z.object({
  name: requiredString('Industry Name'),

  description: z.string().optional(),

  status: z.number().optional()
})
