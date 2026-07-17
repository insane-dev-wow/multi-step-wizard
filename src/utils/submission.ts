import type { WizardFormValues } from '../types/wizard'

export class SubmissionError extends Error {
  constructor(message = 'Submission failed.') {
    super(message)
    this.name = 'SubmissionError'
  }
}

export async function submitApplication(
  data: WizardFormValues,
  options?: { shouldFail?: boolean },
): Promise<void> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 700)
  })

  if (options?.shouldFail) {
    throw new SubmissionError()
  }

  console.log('Submitted values:', data)
}
