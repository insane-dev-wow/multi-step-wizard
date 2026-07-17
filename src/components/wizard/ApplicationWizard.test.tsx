import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../../App'
import { STORAGE_KEY, STORAGE_VERSION } from '../../constants/wizard'
import * as submission from '../../utils/submission'

async function fillUserInfo(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^name$/i), 'Jane Doe')
  await user.type(screen.getByLabelText(/contact number/i), '+1 (555) 123-4567')
  await user.type(screen.getByLabelText(/^email$/i), 'jane@example.com')
}

describe('ApplicationWizard', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('blocks navigation to step 2 when required user fields are empty', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /user information/i })).toBeInTheDocument()
  })

  it('allows valid navigation from step 1 to step 2', async () => {
    const user = userEvent.setup()
    render(<App />)

    await fillUserInfo(user)
    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(
      await screen.findByRole('heading', { name: /request configuration/i }),
    ).toBeInTheDocument()
  })

  it('supports adding, editing, and removing dynamic service items', async () => {
    const user = userEvent.setup()
    render(<App />)

    await fillUserInfo(user)
    await user.click(screen.getByRole('button', { name: /next/i }))
    await screen.findByRole('heading', { name: /request configuration/i })

    await user.click(screen.getByRole('button', { name: /add service/i }))

    const serviceName = screen.getByLabelText(/^service name$/i)
    await user.type(serviceName, 'Cloud Migration')
    await user.type(screen.getByLabelText(/^description$/i), 'Migrate workloads to Azure')
    await user.clear(screen.getByLabelText(/^quantity$/i))
    await user.type(screen.getByLabelText(/^quantity$/i), '3')

    expect(serviceName).toHaveValue('Cloud Migration')

    await user.click(screen.getByRole('button', { name: /remove/i }))
    expect(screen.queryByLabelText(/^service name$/i)).not.toBeInTheDocument()
  })

  it('shows a review summary with values from earlier steps', async () => {
    const user = userEvent.setup()
    render(<App />)

    await fillUserInfo(user)
    await user.click(screen.getByRole('button', { name: /next/i }))
    await screen.findByRole('heading', { name: /request configuration/i })

    await user.click(screen.getByRole('button', { name: /add service/i }))
    await user.type(screen.getByLabelText(/^service name$/i), 'Support Plan')
    await user.type(screen.getByLabelText(/^quantity$/i), '2')

    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('Support Plan')).toBeInTheDocument()
    expect(screen.getByText(/quantity:/i)).toBeInTheDocument()
  })

  it('restores draft data and step position from localStorage', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        currentStep: 1,
        formData: {
          userInfo: {
            name: 'Restored User',
            phone: '+1 555 000 1111',
            email: 'restored@example.com',
          },
          requestItems: [],
        },
        updatedAt: new Date().toISOString(),
      }),
    )

    render(<App />)

    expect(
      await screen.findByRole('heading', { name: /request configuration/i }),
    ).toBeInTheDocument()

    await userEvent.setup().click(screen.getByRole('button', { name: /previous/i }))

    expect(await screen.findByLabelText(/^name$/i)).toHaveValue('Restored User')
    expect(screen.getByLabelText(/^email$/i)).toHaveValue('restored@example.com')
  })

  it('does not crash when localStorage contains malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{ invalid json')

    expect(() => render(<App />)).not.toThrow()
    expect(screen.getByRole('heading', { name: /user information/i })).toBeInTheDocument()
  })

  it('clears localStorage after a successful submission', async () => {
    const user = userEvent.setup()
    const submitSpy = vi.spyOn(submission, 'submitApplication').mockResolvedValue()

    render(<App />)

    await fillUserInfo(user)
    await user.click(screen.getByRole('button', { name: /next/i }))
    await screen.findByRole('heading', { name: /request configuration/i })
    await user.click(screen.getByRole('button', { name: /next/i }))
    await screen.findByRole('heading', { name: /review & confirm/i })

    localStorage.setItem(STORAGE_KEY, '{"version":1}')

    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalled()
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    expect(await screen.findByText(/application submitted/i)).toBeInTheDocument()
  })

  it('preserves the draft when submission fails', async () => {
    const user = userEvent.setup()
    vi.spyOn(submission, 'submitApplication').mockRejectedValue(
      new submission.SubmissionError(),
    )

    render(<App />)

    await fillUserInfo(user)
    await user.click(screen.getByRole('button', { name: /next/i }))
    await screen.findByRole('heading', { name: /request configuration/i })
    await user.click(screen.getByRole('button', { name: /next/i }))
    await screen.findByRole('heading', { name: /review & confirm/i })

    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
    })

    const draftBeforeFailure = localStorage.getItem(STORAGE_KEY)

    await user.click(screen.getByRole('button', { name: /submit/i }))

    expect(
      await screen.findByText(/submission failed\. your draft has been preserved\./i),
    ).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(draftBeforeFailure)
  })
})

describe('storage utilities', () => {
  it('returns null for unsupported draft versions', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 999,
        currentStep: 2,
        formData: {
          userInfo: { name: 'Old', phone: '123', email: 'old@example.com' },
          requestItems: [],
        },
        updatedAt: new Date().toISOString(),
      }),
    )

    render(<App />)

    expect(screen.getByLabelText(/^name$/i)).toHaveValue('')
    expect(screen.getByRole('heading', { name: /user information/i })).toBeInTheDocument()
  })
})
