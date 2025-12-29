import { z } from 'zod'
import { requiredString } from './common'

export const siteRiskSchema = z.object({
  name: requiredString('Site Risk Name'),

  description: z.string().optional(),

  status: z.number().optional()
})
