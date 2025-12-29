import { z } from 'zod'

export const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  description: z.string().optional(),
  status: z.any().default(1)
})
