import { z } from 'zod'
import { requiredString } from './common'

export const todoItemsSchema = z.object({
  title: requiredString('Todo Title'), // 'name' in payload

  status: z.number().optional()
})
