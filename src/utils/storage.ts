import { DRAFT_TTL_MS, STORAGE_KEY, STORAGE_VERSION } from '../constants/wizard'
import type { WizardFormValues } from '../types/wizard'

export interface WizardDraft {
  version: number
  currentStep: number
  formData: WizardFormValues
  updatedAt: string
}

function isExpired(updatedAt: string, now = Date.now()): boolean {
  const timestamp = Date.parse(updatedAt)

  if (Number.isNaN(timestamp)) {
    return true
  }

  return now - timestamp > DRAFT_TTL_MS
}

function isValidDraftShape(draft: unknown): draft is WizardDraft {
  if (!draft || typeof draft !== 'object') {
    return false
  }

  const candidate = draft as Partial<WizardDraft>

  return (
    typeof candidate.version === 'number' &&
    typeof candidate.currentStep === 'number' &&
    typeof candidate.updatedAt === 'string' &&
    typeof candidate.formData === 'object' &&
    candidate.formData !== null
  )
}

export function saveDraft(draft: WizardDraft): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
}

/**
 * Loads a draft when present and valid.
 * Actively clears corrupt, version-mismatched, or expired drafts.
 */
export function loadDraft(now = Date.now()): WizardDraft | null {
  const rawDraft = localStorage.getItem(STORAGE_KEY)

  if (!rawDraft) {
    return null
  }

  try {
    const draft = JSON.parse(rawDraft) as unknown

    if (!isValidDraftShape(draft)) {
      clearDraft()
      return null
    }

    if (draft.version !== STORAGE_VERSION) {
      clearDraft()
      return null
    }

    if (isExpired(draft.updatedAt, now)) {
      clearDraft()
      return null
    }

    return draft
  } catch {
    clearDraft()
    return null
  }
}

export function clearDraft(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export { isExpired }
