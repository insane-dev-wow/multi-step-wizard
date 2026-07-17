import { useFormContext } from 'react-hook-form'

import { STEP_VALIDATION_FIELDS, TOTAL_STEPS } from '../../constants/wizard'
import { useWizard } from '../../context/WizardContext'
import type { WizardFormValues } from '../../types/wizard'

interface WizardFooterProps {
  isSubmitting: boolean
  persistDraftNow: () => void
  onSubmit: () => void
}

export function WizardFooter({
  isSubmitting,
  persistDraftNow,
  onSubmit,
}: WizardFooterProps) {
  const { currentStep, nextStep, previousStep } = useWizard()
  const { trigger } = useFormContext<WizardFormValues>()

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === TOTAL_STEPS - 1

  const isCurrentStepValid = async () => {
    if (currentStep === 0) {
      return trigger([...STEP_VALIDATION_FIELDS[0]])
    }

    if (currentStep === 1) {
      return trigger([...STEP_VALIDATION_FIELDS[1]])
    }

    return true
  }

  const handleNext = async () => {
    const valid = await isCurrentStepValid()

    if (!valid) {
      return
    }

    persistDraftNow()
    nextStep()
  }

  return (
    <footer className="wizard-footer border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <button
          type="button"
          onClick={previousStep}
          disabled={isFirstStep || isSubmitting}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        {isLastStep ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition enabled:hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting…' : 'Submit'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition enabled:hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next
          </button>
        )}
      </div>
    </footer>
  )
}
