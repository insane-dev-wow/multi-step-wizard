import { useFormContext, useWatch } from 'react-hook-form'

import type { WizardFormValues } from '../../../types/wizard'

export function ReviewStep() {
  const { control } = useFormContext<WizardFormValues>()
  const values = useWatch({ control })

  return (
    <section aria-labelledby="review-heading" className="space-y-6">
      <div>
        <h2
          id="review-heading"
          tabIndex={-1}
          className="text-xl font-semibold text-slate-900 outline-none"
        >
          Review & confirm
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Verify your information before submitting the application.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          User information
        </h3>
        <dl className="mt-3 space-y-3">
          <div>
            <dt className="text-xs font-medium uppercase text-slate-500">Name</dt>
            <dd className="mt-0.5 text-base text-slate-900">
              {values.userInfo?.name || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-slate-500">Phone</dt>
            <dd className="mt-0.5 text-base text-slate-900">
              {values.userInfo?.phone || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-slate-500">Email</dt>
            <dd className="mt-0.5 text-base text-slate-900">
              {values.userInfo?.email || '—'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Request items
        </h3>

        {!values.requestItems?.length ? (
          <p className="mt-3 text-sm text-slate-600">No services were added.</p>
        ) : (
          <ul className="mt-3 space-y-4">
            {values.requestItems.map((item, index) => (
              <li
                key={`${item.serviceName}-${index}`}
                className="rounded-lg border border-slate-100 bg-slate-50 p-3"
              >
                <p className="font-medium text-slate-900">{item.serviceName}</p>
                {item.description ? (
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                ) : null}
                <p className="mt-2 text-sm text-slate-700">
                  Quantity: <span className="font-medium">{item.quantity}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
