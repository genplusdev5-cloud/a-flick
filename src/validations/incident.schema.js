import { z } from 'zod'
import { requiredString } from './common'

export const incidentSchema = z.object({
  name: requiredString('Incident Name'),

  description: z.string().optional(),

  status: z.number().optional()
})
