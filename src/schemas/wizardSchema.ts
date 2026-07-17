import { z } from 'zod'

import { EMAIL_PATTERN, PHONE_PATTERN } from '../constants/validation'

export const requestItemSchema = z.object({
  id: z.string().optional(),
  serviceName: z.string().trim().min(1, 'Service name is required.'),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters.'),
  quantity: z.preprocess(
    (value) =>
      typeof value === 'number' && Number.isNaN(value) ? undefined : value,
    z
      .number({ error: 'Quantity is required.' })
      .int('Quantity must be a whole number.')
      .min(1, 'Quantity must be at least one.'),
  ),
})

export const userInfoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .min(2, 'Name must contain at least two characters.'),
  phone: z
    .string()
    .trim()
    .min(1, 'Contact number is required.')
    .regex(PHONE_PATTERN, 'Enter a valid contact number.'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .regex(EMAIL_PATTERN, 'Enter a valid email address.'),
})

export const wizardFormSchema = z.object({
  userInfo: userInfoSchema,
  requestItems: z.array(requestItemSchema),
})

export type WizardFormValues = z.infer<typeof wizardFormSchema>
export type RequestItem = z.infer<typeof requestItemSchema>
