import { useEffect, type RefObject } from 'react'

export function isElementObscured(
  element: HTMLElement,
  viewport: Pick<VisualViewport, 'height' | 'offsetTop'> | null = window.visualViewport,
): boolean {
  if (!viewport) {
    return false
  }

  const rect = element.getBoundingClientRect()
  const visibleBottom = viewport.offsetTop + viewport.height
  const footerReserve = 96

  return (
    rect.bottom > visibleBottom - footerReserve || rect.top < viewport.offsetTop
  )
}

export function setVisualViewportHeight(height: number): void {
  document.documentElement.style.setProperty(
    '--visual-viewport-height',
    `${height}px`,
  )
}

export function clearVisualViewportHeight(): void {
  document.documentElement.style.removeProperty('--visual-viewport-height')
}

export function useMobileViewport(contentRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const viewport = window.visualViewport

    if (!viewport) {
      return
    }

    const updateHeight = () => {
      setVisualViewportHeight(viewport.height)
    }

    updateHeight()
    viewport.addEventListener('resize', updateHeight)
    viewport.addEventListener('scroll', updateHeight)

    return () => {
      viewport.removeEventListener('resize', updateHeight)
      viewport.removeEventListener('scroll', updateHeight)
      clearVisualViewportHeight()
    }
  }, [])

  useEffect(() => {
    const content = contentRef.current

    if (!content) {
      return
    }

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target

      if (!(target instanceof HTMLElement)) {
        return
      }

      if (!content.contains(target)) {
        return
      }

      window.requestAnimationFrame(() => {
        if (isElementObscured(target)) {
          target.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }
      })
    }

    content.addEventListener('focusin', handleFocusIn)

    return () => {
      content.removeEventListener('focusin', handleFocusIn)
    }
  }, [contentRef])
}
