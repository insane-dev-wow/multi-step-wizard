import { useEffect, useRef } from 'react'

import { STEP_HEADING_IDS } from '../constants/wizard'

/**
 * Moves keyboard focus to the active step heading after navigation.
 * Skips the initial mount so page load does not steal focus from inputs.
 * Headings use tabIndex={-1} so they can receive programmatic focus.
 */
export function useStepFocus(currentStep: number) {
  const isFirstRenderRef = useRef(true)

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }

    const headingId = STEP_HEADING_IDS[currentStep]

    if (!headingId) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      const heading = document.getElementById(headingId)

      if (heading instanceof HTMLElement) {
        heading.focus({ preventScroll: false })
      }
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [currentStep])
}
