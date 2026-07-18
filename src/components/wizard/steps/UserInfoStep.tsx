import { useFormContext } from 'react-hook-form'

import type { WizardFormValues } from '../../../types/wizard'
import { FormField, TextInput } from '../../common/FormField'

export function UserInfoStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<WizardFormValues>()

  return (
    <section aria-labelledby="user-info-heading" className="space-y-5">
      <div>
        <h2
          id="user-info-heading"
          tabIndex={-1}
          className="text-xl font-semibold text-slate-900 outline-none"
        >
          User information
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Enter your contact details to begin the application.
        </p>
      </div>

      <FormField id="name" label="Name" error={errors.userInfo?.name?.message}>
        <TextInput
          id="name"
          type="text"
          inputMode="text"
          autoComplete="name"
          enterKeyHint="next"
          aria-invalid={Boolean(errors.userInfo?.name)}
          {...register('userInfo.name')}
        />
      </FormField>

      <FormField
        id="phone"
        label="Contact number"
        error={errors.userInfo?.phone?.message}
      >
        <TextInput
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          enterKeyHint="next"
          aria-invalid={Boolean(errors.userInfo?.phone)}
          {...register('userInfo.phone')}
        />
      </FormField>

      <FormField id="email" label="Email" error={errors.userInfo?.email?.message}>
        <TextInput
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          enterKeyHint="done"
          aria-invalid={Boolean(errors.userInfo?.email)}
          {...register('userInfo.email')}
        />
      </FormField>
    </section>
  )
}
