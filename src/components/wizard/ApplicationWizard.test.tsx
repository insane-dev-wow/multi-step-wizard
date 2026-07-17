import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../../App'
import { DRAFT_TTL_MS, STORAGE_KEY, STORAGE_VERSION } from '../../constants/wizard'
import * as submission from '../../utils/submission'
import { clearDraft, loadDraft } from '../../utils/storage'

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

  it('rejects invalid email and phone formats with RegEx messages', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText(/^name$/i), 'Jane Doe')
    await user.type(screen.getByLabelText(/contact number/i), 'abc')
    await user.type(screen.getByLabelText(/^email$/i), 'not-an-email')
    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(await screen.findByText(/enter a valid contact number/i)).toBeInTheDocument()
    expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument()
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

  it('moves focus to the next step heading after navigation', async () => {
    const user = userEvent.setup()
    render(<App />)

    await fillUserInfo(user)
    await user.click(screen.getByRole('button', { name: /next/i }))

    const heading = await screen.findByRole('heading', {
      name: /request configuration/i,
    })

    await waitFor(() => {
      expect(heading).toHaveFocus()
    })
  })

  it('supports adding, editing, and removing dynamic service items', async () => {
    const user = userEvent.setup()
    render(<App />)

    await fillUserInfo(user)
    await user.click(screen.getByRole('button', { name: /next/i }))
    await screen.findByRole('heading', { name: /request configuration/i })

    await user.click(screen.getByRole('button', { name: /add service/i }))

    const firstServiceName = screen.getByLabelText(/^service name$/i)
    await user.type(firstServiceName, 'Older Service')

    await user.click(screen.getByRole('button', { name: /add service/i }))

    const serviceNames = screen.getAllByLabelText(/^service name$/i)
    expect(serviceNames).toHaveLength(2)
    expect(serviceNames[0]).toHaveValue('')
    expect(serviceNames[1]).toHaveValue('Older Service')

    await user.type(serviceNames[0], 'Newer Service')
    expect(serviceNames[0]).toHaveValue('Newer Service')

    await user.click(screen.getAllByRole('button', { name: /remove/i })[0])
    expect(screen.getByLabelText(/^service name$/i)).toHaveValue('Older Service')
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

  it('does not submit when pressing Enter on earlier steps', async () => {
    const user = userEvent.setup()
    const submitSpy = vi.spyOn(submission, 'submitApplication')

    render(<App />)

    await fillUserInfo(user)
    await user.keyboard('{Enter}')

    expect(submitSpy).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: /user information/i })).toBeInTheDocument()
    expect(screen.queryByText(/application submitted/i)).not.toBeInTheDocument()
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

  it('clears corrupt localStorage drafts instead of crashing', () => {
    localStorage.setItem(STORAGE_KEY, '{ invalid json')

    expect(() => render(<App />)).not.toThrow()
    expect(screen.getByRole('heading', { name: /user information/i })).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
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
  beforeEach(() => {
    localStorage.clear()
  })

  it('clears unsupported draft versions on load', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 999,
        currentStep: 2,
        formData: {
          userInfo: { name: 'Old', phone: '1234567', email: 'old@example.com' },
          requestItems: [],
        },
        updatedAt: new Date().toISOString(),
      }),
    )

    expect(loadDraft()).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('clears expired drafts based on TTL', () => {
    const expiredAt = new Date(Date.now() - DRAFT_TTL_MS - 1000).toISOString()

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        currentStep: 1,
        formData: {
          userInfo: {
            name: 'Expired',
            phone: '+1 555 000 1111',
            email: 'expired@example.com',
          },
          requestItems: [],
        },
        updatedAt: expiredAt,
      }),
    )

    expect(loadDraft()).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('clears drafts with invalid shape', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, broken: true }))

    expect(loadDraft()).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('keeps fresh valid drafts', () => {
    const draft = {
      version: STORAGE_VERSION,
      currentStep: 0,
      formData: {
        userInfo: {
          name: 'Fresh',
          phone: '+1 555 000 1111',
          email: 'fresh@example.com',
        },
        requestItems: [],
      },
      updatedAt: new Date().toISOString(),
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))

    expect(loadDraft()).toEqual(draft)
    clearDraft()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
