import { z } from 'zod'
import { requiredString } from './common'

export const equipmentsSchema = z.object({
  name: requiredString('Equipment Name'),

  description: z.string().optional(),

  status: z.number().optional()
})
