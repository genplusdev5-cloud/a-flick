import { z } from 'zod'

export const requiredString = label => z.string().trim().min(1, `${label} is required`)

export const code = (label = 'Code') =>
  z.string().trim().min(2, `${label} must be at least 2 characters`).max(10, `${label} max 10 characters`)

export const status = z.boolean({
  required_error: 'Status is required'
})

export const optionalString = z.string().optional()

export const requiredSelect = label => z.string().min(1, `${label} is required`)
