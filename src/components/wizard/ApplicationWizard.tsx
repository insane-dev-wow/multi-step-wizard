import { useRef, useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  FormProvider,
  useForm,
  type Resolver,
  type SubmitHandler,
} from 'react-hook-form'

import { DEFAULT_VALUES, TOTAL_STEPS } from '../../constants/wizard'
import { useWizard } from '../../context/WizardContext'
import { useDraftStorage } from '../../hooks/useDraftStorage'
import { useMobileViewport } from '../../hooks/useMobileViewport'
import { useStepFocus } from '../../hooks/useStepFocus'
import { wizardFormSchema } from '../../schemas/wizardSchema'
import type { WizardFormValues } from '../../types/wizard'
import { submitApplication } from '../../utils/submission'
import { StepIndicator } from './StepIndicator'
import { WizardFooter } from './WizardFooter'
import { RequestConfigurationStep } from './steps/RequestConfigurationStep'
import { ReviewStep } from './steps/ReviewStep'
import { UserInfoStep } from './steps/UserInfoStep'

export function ApplicationWizard() {
  const { currentStep, setCurrentStep } = useWizard()
  const contentRef = useRef<HTMLElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const methods = useForm<WizardFormValues>({
    defaultValues: DEFAULT_VALUES,
    resolver: zodResolver(wizardFormSchema) as Resolver<WizardFormValues>,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldUnregister: false,
  })

  const { clearDraft, persistDraftNow } = useDraftStorage({
    methods,
    currentStep,
    setCurrentStep,
  })

  useMobileViewport(contentRef)
  useStepFocus(currentStep)

  const onSubmit: SubmitHandler<WizardFormValues> = async (data) => {
    // Only allow submission from the review step via the Submit button.
    if (currentStep !== TOTAL_STEPS - 1) {
      return
    }

    setSubmitError(null)
    setIsSubmitting(true)

    try {
      await submitApplication(data)
      clearDraft()
      methods.reset(DEFAULT_VALUES)
      setCurrentStep(0)
      setSubmitted(true)
    } catch {
      setSubmitError('Submission failed. Your draft has been preserved.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    // Block Enter-key / implicit submits on earlier steps.
    event.preventDefault()

    if (currentStep !== TOTAL_STEPS - 1 || isSubmitting) {
      return
    }

    void methods.handleSubmit(onSubmit)(event)
  }

  const handleStartNew = () => {
    setSubmitted(false)
    setSubmitError(null)
  }

  if (submitted) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
        <div className="rounded-2xl border border-green-200 bg-green-50 px-6 py-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-green-800">
            Application submitted
          </h2>
          <p className="mt-2 text-sm text-green-700">
            Your request was sent successfully. The saved draft has been cleared.
          </p>
          <button
            type="button"
            onClick={handleStartNew}
            className="mt-6 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
          >
            Start new application
          </button>
        </div>
      </div>
    )
  }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleFormSubmit}
        className="wizard-layout mx-auto flex w-full max-w-3xl flex-col bg-slate-50"
        noValidate
      >
        <StepIndicator />

        <main ref={contentRef} className="wizard-content flex-1 px-4 py-6">
          {submitError ? (
            <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </p>
          ) : null}

          {currentStep === 0 && <UserInfoStep />}
          {currentStep === 1 && <RequestConfigurationStep />}
          {currentStep === 2 && <ReviewStep />}
        </main>

        <WizardFooter
          isSubmitting={isSubmitting}
          persistDraftNow={persistDraftNow}
          onSubmit={() => {
            if (currentStep !== TOTAL_STEPS - 1 || isSubmitting) {
              return
            }

            void methods.handleSubmit(onSubmit)()
          }}
        />
      </form>
    </FormProvider>
  )
}
