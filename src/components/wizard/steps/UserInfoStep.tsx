import { useFormContext } from 'react-hook-form'

import { EMAIL_PATTERN, PHONE_PATTERN } from '../../../constants/validation'
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
        <h2 id="user-info-heading" className="text-xl font-semibold text-slate-900">
          User information
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Enter your contact details to begin the application.
        </p>
      </div>

      <FormField id="name" label="Name" error={errors.userInfo?.name?.message}>
        <TextInput
          id="name"
          autoComplete="name"
          aria-invalid={Boolean(errors.userInfo?.name)}
          {...register('userInfo.name', {
            required: 'Name is required.',
            minLength: {
              value: 2,
              message: 'Name must contain at least two characters.',
            },
          })}
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
          aria-invalid={Boolean(errors.userInfo?.phone)}
          {...register('userInfo.phone', {
            required: 'Contact number is required.',
            pattern: {
              value: PHONE_PATTERN,
              message: 'Enter a valid contact number.',
            },
          })}
        />
      </FormField>

      <FormField id="email" label="Email" error={errors.userInfo?.email?.message}>
        <TextInput
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.userInfo?.email)}
          {...register('userInfo.email', {
            required: 'Email is required.',
            pattern: {
              value: EMAIL_PATTERN,
              message: 'Enter a valid email address.',
            },
          })}
        />
      </FormField>
    </section>
  )
}
