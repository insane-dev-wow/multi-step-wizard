import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { TOTAL_STEPS } from '../constants/wizard'

interface WizardContextValue {
  currentStep: number
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>
  nextStep: () => void
  previousStep: () => void
  goToStep: (step: number) => void
}

const WizardContext = createContext<WizardContextValue | undefined>(undefined)

export function WizardProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(0)

  const value = useMemo(
    () => ({
      currentStep,
      setCurrentStep,
      nextStep: () =>
        setCurrentStep((step) => Math.min(step + 1, TOTAL_STEPS - 1)),
      previousStep: () =>
        setCurrentStep((step) => Math.max(step - 1, 0)),
      goToStep: (step: number) => {
        if (step >= 0 && step < TOTAL_STEPS) {
          setCurrentStep(step)
        }
      },
    }),
    [currentStep],
  )

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  )
}

export function useWizard() {
  const context = useContext(WizardContext)

  if (!context) {
    throw new Error('useWizard must be used inside WizardProvider')
  }

  return context
}
