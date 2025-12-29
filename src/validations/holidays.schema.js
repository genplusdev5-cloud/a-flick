import { z } from 'zod'
import { requiredString } from './common'

export const holidaysSchema = z.object({
  name: requiredString('Holiday Name'),

  date: requiredString('Date'), // YYYY-MM-DD ideally

  year: z.string().optional(),

  status: z.number().optional()
})
