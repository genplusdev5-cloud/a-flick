import { z } from 'zod'

export const designationSchema = z.object({
  name: z.string().min(1, 'Designation name is required'),
  description: z.string().optional(),
  status: z.any().default(1)
})
