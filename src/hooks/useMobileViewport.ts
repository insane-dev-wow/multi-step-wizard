import { useEffect, type RefObject } from 'react'

const FOOTER_FALLBACK_PX = 96
const KEYBOARD_SETTLE_DELAYS_MS = [50, 150, 320]

export function isEditableField(element: EventTarget | null): element is HTMLElement {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    (element instanceof HTMLElement && element.isContentEditable)
  )
}

export function getFooterReservePx(): number {
  const footer = document.querySelector('.wizard-footer')

  if (!(footer instanceof HTMLElement)) {
    return FOOTER_FALLBACK_PX
  }

  return Math.max(footer.getBoundingClientRect().height, FOOTER_FALLBACK_PX)
}

export function isElementObscured(
  element: HTMLElement,
  viewport: Pick<VisualViewport, 'height' | 'offsetTop'> | null = window.visualViewport,
  footerReserve = getFooterReservePx(),
): boolean {
  if (!viewport) {
    return false
  }

  const rect = element.getBoundingClientRect()
  const visibleTop = viewport.offsetTop
  const visibleBottom = viewport.offsetTop + viewport.height

  return (
    rect.bottom > visibleBottom - footerReserve ||
    rect.top < visibleTop ||
    rect.bottom > visibleBottom
  )
}

export function setVisualViewportMetrics(
  height: number,
  offsetTop = 0,
  keyboardOpen = false,
): void {
  const root = document.documentElement
  root.style.setProperty('--visual-viewport-height', `${height}px`)
  root.style.setProperty('--visual-viewport-offset-top', `${offsetTop}px`)
  root.style.setProperty('--keyboard-inset', keyboardOpen ? '1' : '0')
  root.dataset.keyboardOpen = keyboardOpen ? 'true' : 'false'
}

export function clearVisualViewportHeight(): void {
  const root = document.documentElement
  root.style.removeProperty('--visual-viewport-height')
  root.style.removeProperty('--visual-viewport-offset-top')
  root.style.removeProperty('--keyboard-inset')
  delete root.dataset.keyboardOpen
}

export function ensureFieldVisible(element: HTMLElement): void {
  if (!isElementObscured(element)) {
    return
  }

  const scrollParent = element.closest('.wizard-content')

  if (scrollParent instanceof HTMLElement) {
    const fieldRect = element.getBoundingClientRect()
    const parentRect = scrollParent.getBoundingClientRect()
    const footerReserve = getFooterReservePx()
    const visibleHeight = parentRect.height - footerReserve * 0.25
    const targetTop =
      scrollParent.scrollTop +
      (fieldRect.top - parentRect.top) -
      visibleHeight / 2 +
      fieldRect.height / 2

    scrollParent.scrollTo({
      top: Math.max(0, targetTop),
      behavior: 'smooth',
    })
    return
  }

  element.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

function isKeyboardLikelyOpen(viewport: VisualViewport): boolean {
  return viewport.height < window.innerHeight * 0.85
}

export function useMobileViewport(contentRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const viewport = window.visualViewport
    let focusedField: HTMLElement | null = null
    const settleTimers: number[] = []

    const updateViewportMetrics = () => {
      if (!viewport) {
        setVisualViewportMetrics(window.innerHeight, 0, false)
        return
      }

      setVisualViewportMetrics(
        viewport.height,
        viewport.offsetTop,
        isKeyboardLikelyOpen(viewport),
      )
    }

    const scheduleEnsureVisible = (element: HTMLElement) => {
      window.requestAnimationFrame(() => {
        ensureFieldVisible(element)
      })

      for (const delay of KEYBOARD_SETTLE_DELAYS_MS) {
        const timerId = window.setTimeout(() => {
          if (document.activeElement === element) {
            ensureFieldVisible(element)
          }
        }, delay)
        settleTimers.push(timerId)
      }
    }

    const clearSettleTimers = () => {
      while (settleTimers.length > 0) {
        window.clearTimeout(settleTimers.pop())
      }
    }

    const handleViewportChange = () => {
      updateViewportMetrics()

      if (focusedField && document.activeElement === focusedField) {
        ensureFieldVisible(focusedField)
      }
    }

    updateViewportMetrics()

    if (viewport) {
      viewport.addEventListener('resize', handleViewportChange)
      viewport.addEventListener('scroll', handleViewportChange)
    }

    window.addEventListener('resize', handleViewportChange)

    const content = contentRef.current

    const handleFocusIn = (event: FocusEvent) => {
      if (!isEditableField(event.target)) {
        return
      }

      if (content && !content.contains(event.target)) {
        return
      }

      focusedField = event.target
      clearSettleTimers()
      scheduleEnsureVisible(event.target)
    }

    const handleFocusOut = () => {
      focusedField = null
      clearSettleTimers()

      // Reset metrics after keyboard dismissal settles.
      window.setTimeout(updateViewportMetrics, 180)
    }

    content?.addEventListener('focusin', handleFocusIn)
    content?.addEventListener('focusout', handleFocusOut)

    return () => {
      clearSettleTimers()

      if (viewport) {
        viewport.removeEventListener('resize', handleViewportChange)
        viewport.removeEventListener('scroll', handleViewportChange)
      }

      window.removeEventListener('resize', handleViewportChange)
      content?.removeEventListener('focusin', handleFocusIn)
      content?.removeEventListener('focusout', handleFocusOut)
      clearVisualViewportHeight()
    }
  }, [contentRef])
}
