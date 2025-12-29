import { z } from 'zod'

export const employeeLeaveTypeSchema = z.object({
  leaveCode: z.string().min(1, 'Leave Code is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.any().default(1)
})
