import { useEffect, useRef } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'

import { STORAGE_VERSION } from '../constants/wizard'
import type { WizardFormValues } from '../types/wizard'
import { clearDraft, loadDraft, saveDraft } from '../utils/storage'

interface UseDraftStorageOptions {
  methods: UseFormReturn<WizardFormValues>
  currentStep: number
  setCurrentStep: (step: number) => void
}

export function useDraftStorage({
  methods,
  currentStep,
  setCurrentStep,
}: UseDraftStorageOptions) {
  const { reset, control } = methods
  const values = useWatch({ control })
  const hasRestoredRef = useRef(false)

  useEffect(() => {
    if (hasRestoredRef.current) {
      return
    }

    const draft = loadDraft()

    if (draft) {
      reset(draft.formData)
      setCurrentStep(draft.currentStep)
    }

    hasRestoredRef.current = true
  }, [reset, setCurrentStep])

  useEffect(() => {
    if (!hasRestoredRef.current) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      saveDraft({
        version: STORAGE_VERSION,
        currentStep,
        formData: values as WizardFormValues,
        updatedAt: new Date().toISOString(),
      })
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [values, currentStep])

  const persistDraftNow = () => {
    saveDraft({
      version: STORAGE_VERSION,
      currentStep,
      formData: methods.getValues(),
      updatedAt: new Date().toISOString(),
    })
  }

  return {
    clearDraft,
    persistDraftNow,
  }
}
