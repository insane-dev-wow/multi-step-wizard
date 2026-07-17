import { STEP_LABELS, TOTAL_STEPS } from '../../constants/wizard'
import { useWizard } from '../../context/WizardContext'

export function StepIndicator() {
  const { currentStep } = useWizard()

  return (
    <nav aria-label="Wizard progress" className="border-b border-slate-200 bg-white px-4 py-4">
      <ol className="mx-auto flex max-w-3xl items-center justify-between gap-2">
        {STEP_LABELS.map((label, index) => {
          const isActive = index === currentStep
          const isComplete = index < currentStep

          return (
            <li key={label} className="flex flex-1 flex-col items-center gap-2">
              <span
                aria-current={isActive ? 'step' : undefined}
                className={[
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isComplete
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-500',
                ].join(' ')}
              >
                {index + 1}
              </span>
              <span
                className={[
                  'hidden text-center text-xs font-medium sm:block',
                  isActive ? 'text-blue-700' : 'text-slate-500',
                ].join(' ')}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-center text-sm text-slate-600 sm:hidden">
        Step {currentStep + 1} of {TOTAL_STEPS}: {STEP_LABELS[currentStep]}
      </p>
    </nav>
  )
}
