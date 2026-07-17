# Multi-Step Application & Contract Request Wizard

A mobile-optimized three-step application and contract-request wizard built for a technical assessment. It demonstrates multi-step form state synchronization, dynamic validation, local draft recovery, and mobile keyboard/viewport handling.

## Live Demo

Deploy to Vercel or Netlify and add your production URL here.

## Tech Stack

- **React + Vite + TypeScript** — fast local development and a simple production build pipeline
- **React Hook Form** — unified form state, field-level validation, and `useFieldArray` for dynamic rows
- **Tailwind CSS** — utility-first styling with minimal custom CSS
- **React Context** — wizard navigation state only (`currentStep`)
- **Vitest + React Testing Library** — behavior-focused automated tests

## Getting Started

```bash
npm install
npm run dev
```

Other commands:

```bash
npm run build
npm run test
npm run preview
```

## Architecture

```
App
└── WizardProvider
    └── ApplicationWizard
        ├── StepIndicator
        ├── UserInfoStep
        ├── RequestConfigurationStep
        ├── ReviewStep
        └── WizardFooter
```

### Form field schemas without component bloat

Form values live in a **single React Hook Form instance** wrapped by `FormProvider`. Each step is a separate component that calls `useFormContext()` instead of receiving dozens of props.

Shared presentation pieces (`FormField`, `TextInput`, `TextArea`, `ErrorMessage`) keep markup consistent, while validation rules stay next to each field through `register()`. Nested form shape (`userInfo`, `requestItems`) keeps step boundaries clear:

```ts
{
  userInfo: { name, phone, email },
  requestItems: [{ serviceName, description, quantity }]
}
```

Step-specific validation is triggered through React Hook Form’s `trigger()` API so only the active step is validated when the user clicks **Next**.

### State management

| Concern | Owner |
| --- | --- |
| Input values | React Hook Form |
| Current step / navigation | React Context |
| Submit / success UI | Local component state |
| Draft persistence | `useDraftStorage` hook + LocalStorage |

Form data is **not duplicated** in context. Hidden steps remain registered because `shouldUnregister: false`.

## Validation

- Email: `EMAIL_PATTERN`
- Phone: `PHONE_PATTERN`
- Step 1: required name (min 2 chars), phone, email
- Step 2: validates each dynamic row when present; empty array is allowed
- `mode: "onBlur"` — first validation on blur
- `reValidateMode: "onChange"` — corrections update errors while typing

## Draft Persistence

- **Key:** `si-application-wizard-draft`
- **Stored shape:** `{ version, currentStep, formData, updatedAt }`
- Draft is restored once on mount via `reset()`
- Writes are debounced (~500ms)
- Draft is saved immediately before step changes
- Draft is cleared **only after successful submission**
- Failed submissions keep the draft intact

## Mobile Viewport & Keyboard Handling

Mobile layout uses a scrollable content region with a sticky footer:

- `100dvh` and `visualViewport` height CSS variable for dynamic viewport sizing
- `overflow-y: auto` on `.wizard-content`
- Bottom padding reserves space for sticky actions + `env(safe-area-inset-bottom)`
- `useMobileViewport` listens to `visualViewport` resize events
- On focus, inputs scroll into view only when obscured by the keyboard or footer

This keeps focused fields visible when the virtual keyboard opens in mobile browsers and WebViews.

## Automated Tests

```bash
npm run test
```

Coverage includes:

1. Step validation blocks invalid navigation
2. Valid navigation to step 2
3. Dynamic add/edit/remove service items
4. Review summary rendering
5. Draft restoration from LocalStorage
6. Malformed LocalStorage does not crash the app
7. Successful submission clears LocalStorage
8. Failed submission preserves the draft

## Deployment

Build the production bundle:

```bash
npm run build
```

Deploy the `dist` folder to Vercel or Netlify. Test on a physical mobile device after deployment to verify keyboard and sticky footer behavior.

## Technical Note (Assessment Summary)

**Form schemas:** One React Hook Form instance owns all values. Steps consume shared context through `FormProvider`, validation rules stay colocated with fields, and `trigger()` enforces linear step progression without copying state into React Context.

**Viewport recalculation:** The layout combines `100dvh`, a `visualViewport`-driven CSS variable, a scrollable main region, sticky footer spacing, and conditional `scrollIntoView()` on focus so inputs remain visible when mobile keyboards resize the viewport.
