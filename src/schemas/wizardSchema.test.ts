import { describe, expect, it } from 'vitest'

import { wizardFormSchema } from './wizardSchema'

describe('wizardFormSchema', () => {
  it('accepts valid wizard values', () => {
    const result = wizardFormSchema.safeParse({
      userInfo: {
        name: 'Jane Doe',
        phone: '+1 (555) 123-4567',
        email: 'jane@example.com',
      },
      requestItems: [
        {
          serviceName: 'Support',
          description: 'Priority support',
          quantity: 2,
        },
      ],
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid email and phone formats', () => {
    const result = wizardFormSchema.safeParse({
      userInfo: {
        name: 'Jane Doe',
        phone: 'short',
        email: 'bad-email',
      },
      requestItems: [],
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message)
      expect(messages).toContain('Enter a valid contact number.')
      expect(messages).toContain('Enter a valid email address.')
    }
  })
})
