import { render, waitFor } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearVisualViewportHeight,
  ensureFieldVisible,
  isEditableField,
  isElementObscured,
  setVisualViewportMetrics,
  useMobileViewport,
} from './useMobileViewport'

function ViewportHarness() {
  const contentRef = useRef<HTMLDivElement>(null)
  useMobileViewport(contentRef)

  return (
    <div ref={contentRef} className="wizard-content">
      <input aria-label="name" type="text" inputMode="text" />
      <input aria-label="phone" type="tel" inputMode="tel" />
      <input aria-label="email" type="email" inputMode="email" />
      <textarea aria-label="notes" />
      <input aria-label="quantity" type="number" inputMode="numeric" />
    </div>
  )
}

describe('useMobileViewport', () => {
  const listeners = new Map<string, Set<() => void>>()

  beforeEach(() => {
    listeners.clear()
    clearVisualViewportHeight()
    vi.useFakeTimers({ shouldAdvanceTime: true })

    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 800,
    })

    const visualViewport = {
      height: 800,
      offsetTop: 0,
      addEventListener: (type: string, listener: () => void) => {
        const set = listeners.get(type) ?? new Set()
        set.add(listener)
        listeners.set(type, set)
      },
      removeEventListener: (type: string, listener: () => void) => {
        listeners.get(type)?.delete(listener)
      },
    }

    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: visualViewport,
    })
  })

  afterEach(() => {
    clearVisualViewportHeight()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('sets visual viewport CSS variables on mount and keyboard resize', async () => {
    render(<ViewportHarness />)

    expect(
      document.documentElement.style.getPropertyValue('--visual-viewport-height'),
    ).toBe('800px')
    expect(document.documentElement.dataset.keyboardOpen).toBe('false')

    const viewport = window.visualViewport as unknown as {
      height: number
      offsetTop: number
    }
    viewport.height = 420
    viewport.offsetTop = 12

    listeners.get('resize')?.forEach((listener) => listener())

    await waitFor(() => {
      expect(
        document.documentElement.style.getPropertyValue('--visual-viewport-height'),
      ).toBe('420px')
      expect(
        document.documentElement.style.getPropertyValue('--visual-viewport-offset-top'),
      ).toBe('12px')
      expect(document.documentElement.dataset.keyboardOpen).toBe('true')
    })
  })

  it.each([
    ['name', 'input[aria-label="name"]'],
    ['phone', 'input[aria-label="phone"]'],
    ['email', 'input[aria-label="email"]'],
    ['notes', 'textarea[aria-label="notes"]'],
    ['quantity', 'input[aria-label="quantity"]'],
  ])(
    'keeps focused %s field visible when the keyboard obscures it',
    async (_label, selector) => {
      render(<ViewportHarness />)

      const field = document.querySelector(selector) as HTMLElement
      const scrollTo = vi.fn()
      const content = document.querySelector('.wizard-content') as HTMLElement

      Object.defineProperty(content, 'scrollTop', {
        configurable: true,
        writable: true,
        value: 0,
      })
      content.scrollTo = scrollTo as unknown as typeof content.scrollTo

      vi.spyOn(field, 'getBoundingClientRect').mockReturnValue({
        top: 500,
        bottom: 540,
        left: 0,
        right: 100,
        width: 100,
        height: 40,
        x: 0,
        y: 500,
        toJSON: () => ({}),
      })
      vi.spyOn(content, 'getBoundingClientRect').mockReturnValue({
        top: 0,
        bottom: 300,
        left: 0,
        right: 400,
        width: 400,
        height: 300,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      })

      Object.assign(window.visualViewport as object, {
        height: 300,
        offsetTop: 0,
      })

      Object.defineProperty(document, 'activeElement', {
        configurable: true,
        get: () => field,
      })

      field.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))

      await vi.runAllTimersAsync()

      expect(scrollTo).toHaveBeenCalled()
    },
  )

  it('does not scroll when the focused input is fully visible', async () => {
    render(<ViewportHarness />)

    const input = document.querySelector('input[aria-label="name"]') as HTMLInputElement
    const content = document.querySelector('.wizard-content') as HTMLElement
    const scrollTo = vi.fn()
    content.scrollTo = scrollTo as unknown as typeof content.scrollTo

    vi.spyOn(input, 'getBoundingClientRect').mockReturnValue({
      top: 40,
      bottom: 80,
      left: 0,
      right: 100,
      width: 100,
      height: 40,
      x: 0,
      y: 40,
      toJSON: () => ({}),
    })
    vi.spyOn(content, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      bottom: 800,
      left: 0,
      right: 400,
      width: 400,
      height: 800,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    Object.assign(window.visualViewport as object, {
      height: 800,
      offsetTop: 0,
    })

    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await vi.runAllTimersAsync()

    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('re-checks visibility after visualViewport resize while a field is focused', async () => {
    render(<ViewportHarness />)

    const input = document.querySelector('input[aria-label="email"]') as HTMLInputElement
    const content = document.querySelector('.wizard-content') as HTMLElement
    const scrollTo = vi.fn()
    content.scrollTo = scrollTo as unknown as typeof content.scrollTo

    Object.defineProperty(content, 'scrollTop', {
      configurable: true,
      writable: true,
      value: 0,
    })

    vi.spyOn(input, 'getBoundingClientRect').mockReturnValue({
      top: 40,
      bottom: 80,
      left: 0,
      right: 100,
      width: 100,
      height: 40,
      x: 0,
      y: 40,
      toJSON: () => ({}),
    })
    vi.spyOn(content, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      bottom: 800,
      left: 0,
      right: 400,
      width: 400,
      height: 800,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    Object.defineProperty(document, 'activeElement', {
      configurable: true,
      get: () => input,
    })

    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await vi.runAllTimersAsync()
    expect(scrollTo).not.toHaveBeenCalled()

    Object.assign(window.visualViewport as object, {
      height: 280,
      offsetTop: 0,
    })
    vi.spyOn(input, 'getBoundingClientRect').mockReturnValue({
      top: 220,
      bottom: 260,
      left: 0,
      right: 100,
      width: 100,
      height: 40,
      x: 0,
      y: 220,
      toJSON: () => ({}),
    })
    vi.spyOn(content, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      bottom: 280,
      left: 0,
      right: 400,
      width: 400,
      height: 280,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    listeners.get('resize')?.forEach((listener) => listener())

    expect(scrollTo).toHaveBeenCalled()
  })

  it('detects obscured elements against the visual viewport', () => {
    const element = document.createElement('input')
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 500,
      bottom: 540,
      left: 0,
      right: 100,
      width: 100,
      height: 40,
      x: 0,
      y: 500,
      toJSON: () => ({}),
    })

    expect(
      isElementObscured(
        element,
        {
          height: 300,
          offsetTop: 0,
        },
        96,
      ),
    ).toBe(true)

    expect(
      isElementObscured(
        element,
        {
          height: 800,
          offsetTop: 0,
        },
        96,
      ),
    ).toBe(false)
  })

  it('recognizes text, email, tel, textarea, and number fields as editable', () => {
    expect(isEditableField(document.createElement('input'))).toBe(true)
    expect(isEditableField(document.createElement('textarea'))).toBe(true)
    expect(Boolean(isEditableField(document.createElement('button')))).toBe(false)
    expect(Boolean(isEditableField(null))).toBe(false)
  })

  it('clears viewport CSS helpers', () => {
    setVisualViewportMetrics(640, 8, true)
    expect(
      document.documentElement.style.getPropertyValue('--visual-viewport-height'),
    ).toBe('640px')
    expect(document.documentElement.dataset.keyboardOpen).toBe('true')

    clearVisualViewportHeight()
    expect(
      document.documentElement.style.getPropertyValue('--visual-viewport-height'),
    ).toBe('')
    expect(document.documentElement.dataset.keyboardOpen).toBeUndefined()
  })

  it('falls back to scrollIntoView when no scroll parent exists', () => {
    Object.assign(window.visualViewport as object, {
      height: 300,
      offsetTop: 0,
    })

    const input = document.createElement('input')
    const scrollIntoView = vi.fn()
    input.scrollIntoView = scrollIntoView

    vi.spyOn(input, 'getBoundingClientRect').mockReturnValue({
      top: 500,
      bottom: 540,
      left: 0,
      right: 100,
      width: 100,
      height: 40,
      x: 0,
      y: 500,
      toJSON: () => ({}),
    })

    ensureFieldVisible(input)
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: 'center',
      behavior: 'smooth',
    })
  })
})
