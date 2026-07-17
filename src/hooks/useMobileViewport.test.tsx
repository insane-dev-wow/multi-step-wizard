import { render, waitFor } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearVisualViewportHeight,
  isElementObscured,
  setVisualViewportHeight,
  useMobileViewport,
} from './useMobileViewport'

function ViewportHarness() {
  const contentRef = useRef<HTMLDivElement>(null)
  useMobileViewport(contentRef)

  return (
    <div ref={contentRef}>
      <input aria-label="phone" />
    </div>
  )
}

describe('useMobileViewport', () => {
  const listeners = new Map<string, Set<() => void>>()

  beforeEach(() => {
    listeners.clear()
    clearVisualViewportHeight()

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
    vi.restoreAllMocks()
  })

  it('sets --visual-viewport-height on mount and keyboard resize', async () => {
    render(<ViewportHarness />)

    expect(
      document.documentElement.style.getPropertyValue('--visual-viewport-height'),
    ).toBe('800px')

    const viewport = window.visualViewport as unknown as {
      height: number
    }
    viewport.height = 420

    listeners.get('resize')?.forEach((listener) => listener())

    await waitFor(() => {
      expect(
        document.documentElement.style.getPropertyValue('--visual-viewport-height'),
      ).toBe('420px')
    })
  })

  it('scrolls focused inputs into view when the keyboard obscures them', async () => {
    render(<ViewportHarness />)

    const input = document.querySelector('input') as HTMLInputElement
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

    Object.assign(window.visualViewport as object, {
      height: 300,
      offsetTop: 0,
    })

    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledWith({
        block: 'center',
        behavior: 'smooth',
      })
    })
  })

  it('does not scroll when the focused input is fully visible', async () => {
    render(<ViewportHarness />)

    const input = document.querySelector('input') as HTMLInputElement
    const scrollIntoView = vi.fn()
    input.scrollIntoView = scrollIntoView

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

    Object.assign(window.visualViewport as object, {
      height: 800,
      offsetTop: 0,
    })

    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))

    await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)))

    expect(scrollIntoView).not.toHaveBeenCalled()
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
      isElementObscured(element, {
        height: 300,
        offsetTop: 0,
      }),
    ).toBe(true)

    expect(
      isElementObscured(element, {
        height: 800,
        offsetTop: 0,
      }),
    ).toBe(false)
  })

  it('clears the CSS variable helper', () => {
    setVisualViewportHeight(640)
    expect(
      document.documentElement.style.getPropertyValue('--visual-viewport-height'),
    ).toBe('640px')

    clearVisualViewportHeight()
    expect(
      document.documentElement.style.getPropertyValue('--visual-viewport-height'),
    ).toBe('')
  })
})
