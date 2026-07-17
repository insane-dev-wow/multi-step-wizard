import { STORAGE_KEY, STORAGE_VERSION } from '../constants/wizard'
import type { WizardFormValues } from '../types/wizard'

export interface WizardDraft {
  version: number
  currentStep: number
  formData: WizardFormValues
  updatedAt: string
}

export function saveDraft(draft: WizardDraft): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
}

export function loadDraft(): WizardDraft | null {
  const rawDraft = localStorage.getItem(STORAGE_KEY)

  if (!rawDraft) {
    return null
  }

  try {
    const draft = JSON.parse(rawDraft) as WizardDraft

    if (draft.version !== STORAGE_VERSION) {
      return null
    }

    return draft
  } catch {
    return null
  }
}

export function clearDraft(): void {
  localStorage.removeItem(STORAGE_KEY)
}
