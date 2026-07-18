# Multi-Step Application & Contract Request Wizard

A mobile-optimized three-step application and contract-request wizard built for a technical assessment. It demonstrates multi-step form state synchronization, dynamic validation, local draft recovery, and mobile keyboard/viewport handling.

## Live Demo

Deploy to Vercel or Netlify and add your production URL here.

## Tech Stack

- **React + Vite + TypeScript** — fast local development and a simple production build pipeline
- **React Hook Form + Zod** — unified form state with a shared schema via `@hookform/resolvers`
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

Form values live in a **single React Hook Form instance** wrapped by `FormProvider`. Validation rules live in a shared **Zod schema** (`src/schemas/wizardSchema.ts`) and are wired through `zodResolver`, so step components stay presentational.

Shared presentation pieces (`FormField`, `TextInput`, `TextArea`, `ErrorMessage`) keep markup consistent. Nested form shape (`userInfo`, `requestItems`) keeps step boundaries clear:

```ts
{
  userInfo: { name, phone, email },
  requestItems: [{ serviceName, description, quantity }]
}
```

Step-specific validation is triggered through React Hook Form’s `trigger()` API so only the active step is validated when the user clicks **Next**. After each step change, `useStepFocus` moves focus to the new step heading for keyboard and screen-reader users.

### State management

| Concern | Owner |
| --- | --- |
| Input values | React Hook Form |
| Current step / navigation | React Context |
| Submit / success UI | Local component state |
| Draft persistence | `useDraftStorage` hook + LocalStorage |

Form data is **not duplicated** in context. Hidden steps remain registered because `shouldUnregister: false`.

## Validation

- Shared Zod schema with email/phone RegEx patterns
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
- Corrupt, version-mismatched, or expired drafts (7-day TTL) are actively cleared on load

## Mobile Viewport & Keyboard Handling

Mobile layout uses a scrollable content region with a sticky footer:

- Layout height tracks `visualViewport` (`--visual-viewport-height`) with smooth resize
- `interactive-widget=resizes-content` helps browsers shrink content when the keyboard opens
- Sticky footer stays inside the visible viewport, not behind the keyboard
- On focus (text, email, tel, textarea, number), fields are scrolled into view
- Visibility is re-checked after keyboard animation settle delays and viewport resize
- `16px` input font size prevents iOS focus zoom
- Safe-area padding protects controls on devices with a home indicator

This keeps focused fields visible when the virtual keyboard opens in mobile browsers and WebViews.

## Automated Tests

```bash
npm run test
```

Coverage includes:

1. Step validation blocks invalid navigation
2. Invalid email/phone RegEx rejection
3. Valid navigation to step 2
4. Focus moves to the next step heading
5. Dynamic add/edit/remove service items
6. Review summary rendering
7. Draft restoration from LocalStorage
8. Corrupt LocalStorage drafts are cleared safely
9. Successful submission clears LocalStorage
10. Failed submission preserves the draft
11. Expired / version-mismatched draft cleanup
12. Mobile keyboard `visualViewport` resize and focus-scroll behavior

## Deployment

Build the production bundle:

```bash
npm run build
```

Deploy the `dist` folder to Vercel or Netlify. Test on a physical mobile device after deployment to verify keyboard and sticky footer behavior.

## Technical Note (Assessment Summary)

**Form schemas:** One React Hook Form instance owns all values. A Zod schema centralizes validation, steps consume shared context through `FormProvider`, and `trigger()` enforces linear step progression without copying state into React Context.

**Viewport recalculation:** The layout combines `100dvh`, a `visualViewport`-driven CSS variable, a scrollable main region, sticky footer spacing, and conditional `scrollIntoView()` on focus so inputs remain visible when mobile keyboards resize the viewport.
