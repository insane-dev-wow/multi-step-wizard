import type { WizardFormValues } from '../types/wizard'

export const STORAGE_KEY = 'si-application-wizard-draft'
export const STORAGE_VERSION = 1

/** Drafts older than this TTL are cleared on load. */
export const DRAFT_TTL_MS = 1000 * 60 * 60 * 24 * 7

export const DEFAULT_VALUES: WizardFormValues = {
  userInfo: {
    name: '',
    phone: '',
    email: '',
  },
  requestItems: [],
}

export const STEP_FIELDS: Record<number, Array<keyof WizardFormValues>> = {
  0: ['userInfo'],
  1: ['requestItems'],
  2: [],
}

export const STEP_VALIDATION_FIELDS = {
  0: ['userInfo.name', 'userInfo.phone', 'userInfo.email'] as const,
  1: ['requestItems'] as const,
}

export const TOTAL_STEPS = 3

export const STEP_LABELS = [
  'User Info',
  'Request Configuration',
  'Review & Confirm',
]

export const STEP_HEADING_IDS = [
  'user-info-heading',
  'request-config-heading',
  'review-heading',
] as const
