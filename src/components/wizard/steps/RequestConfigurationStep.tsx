import { useFieldArray, useFormContext } from 'react-hook-form'

import type { WizardFormValues } from '../../../types/wizard'
import { FormField, TextArea, TextInput } from '../../common/FormField'

export function RequestConfigurationStep() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<WizardFormValues>()

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'requestItems',
  })

  const requestItemsErrors = errors.requestItems

  return (
    <section aria-labelledby="request-config-heading" className="space-y-5">
      <div>
        <h2
          id="request-config-heading"
          tabIndex={-1}
          className="text-xl font-semibold text-slate-900 outline-none"
        >
          Request configuration
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Add optional services or items for your contract request.
        </p>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
          No services added yet. Use the button below to add your first item.
        </p>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => {
            const itemErrors = Array.isArray(requestItemsErrors)
              ? requestItemsErrors[index]
              : undefined

            return (
              <article
                key={field.id}
                className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Service {index + 1}
                  </h3>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="rounded-md px-2 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>

                <FormField
                  id={`requestItems.${index}.serviceName`}
                  label="Service name"
                  error={itemErrors?.serviceName?.message}
                >
                  <TextInput
                    id={`requestItems.${index}.serviceName`}
                    aria-invalid={Boolean(itemErrors?.serviceName)}
                    {...register(`requestItems.${index}.serviceName`)}
                  />
                </FormField>

                <FormField
                  id={`requestItems.${index}.description`}
                  label="Description"
                  error={itemErrors?.description?.message}
                >
                  <TextArea
                    id={`requestItems.${index}.description`}
                    aria-invalid={Boolean(itemErrors?.description)}
                    {...register(`requestItems.${index}.description`)}
                  />
                </FormField>

                <FormField
                  id={`requestItems.${index}.quantity`}
                  label="Quantity"
                  error={itemErrors?.quantity?.message}
                >
                  <TextInput
                    id={`requestItems.${index}.quantity`}
                    type="number"
                    min={1}
                    inputMode="numeric"
                    aria-invalid={Boolean(itemErrors?.quantity)}
                    {...register(`requestItems.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                  />
                </FormField>
              </article>
            )
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() =>
          append({
            serviceName: '',
            description: '',
            quantity: 1,
          })
        }
        className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
      >
        Add service
      </button>
    </section>
  )
}
