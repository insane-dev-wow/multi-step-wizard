# Multi-Step Application & Contract Request Wizard

A mobile-optimized three-step "Application & Contract Request" wizard built for a technical assessment. It focuses on multi-step global state synchronization, dynamic RegEx validation, crash-resilient local draft autosave, and mobile virtual-keyboard/viewport handling.

## Live Demo

Deploy to Vercel or Netlify and add your production URL here.

## Tech Stack

- **React + Vite + TypeScript** — fast dev server and a simple production build
- **React Hook Form + Zod** — one unified form instance with a shared schema via `@hookform/resolvers`
- **Tailwind CSS** — utility-first styling with minimal custom CSS
- **React Context** — wizard navigation state only (`currentStep`)
- **Vitest + React Testing Library** — behavior-focused automated tests

## Getting Started

```bash
npm install
npm run dev
```

The dev server runs at `http://127.0.0.1:3000` (bound to IPv4 to avoid `localhost` IPv6 issues on Windows).

Other commands:

```bash
npm run build     # type-check + production build
npm run test      # run the Vitest suite once
npm run preview   # preview the production build
npm run lint      # run ESLint
```

## Core Features

### 1. Three-step wizard with linear enforcement

| Step | Screen | Contents |
| --- | --- | --- |
| 1 | User Info | Name, contact number, email |
| 2 | Request Configuration | Dynamic add/remove/edit list of services |
| 3 | Review & Confirm | Immutable summary before mock submission |

The **Next** button validates only the current step via React Hook Form's `trigger()`. Users can advance only when the active step passes validation, but errors are shown on click rather than permanently disabling the button.

### 2. Validation & draft recovery

- Real-time RegEx validation for email and phone
- Errors toggle on blur and update while typing as the user corrects them
- Debounced LocalStorage autosave restores the exact step and field values after a crash or refresh
- Draft is cleared **only after a successful submit**

### 3. Mobile web & WebView optimization

- Sticky action bar (Previous / Next / Submit) pinned to the screen base
- Layout height tracks the visual viewport so the rising keyboard never covers inputs or hides the footer

## Architecture

```
App
└── WizardProvider
    └── ApplicationWizard              (single useForm instance + FormProvider)
        ├── StepIndicator
        ├── UserInfoStep
        ├── RequestConfigurationStep
        ├── ReviewStep
        └── WizardFooter
```

### Project structure

```
src/
├── components/
│   ├── common/FormField.tsx           # FormField, TextInput, TextArea, ErrorMessage
│   └── wizard/
│       ├── ApplicationWizard.tsx      # form instance, submit flow, layout
│       ├── StepIndicator.tsx
│       ├── WizardFooter.tsx           # step validation + navigation
│       └── steps/
│           ├── UserInfoStep.tsx
│           ├── RequestConfigurationStep.tsx
│           └── ReviewStep.tsx
├── context/WizardContext.tsx          # currentStep + navigation only
├── hooks/
│   ├── useDraftStorage.ts             # debounced save / restore / clear
│   ├── useMobileViewport.ts           # visualViewport + keyboard focus handling
│   └── useStepFocus.ts                # focus the new step heading
├── schemas/wizardSchema.ts            # shared Zod schema
├── constants/{validation,wizard}.ts
├── utils/{storage,submission}.ts
└── types/wizard.ts                    # types inferred from the Zod schema
```

### Form field schemas without component bloat

All form values live in a **single React Hook Form instance** wrapped by `FormProvider`. Validation rules live in a shared **Zod schema** (`src/schemas/wizardSchema.ts`) wired through `zodResolver`, so step components stay presentational and read errors through `useFormContext()`.

Shared presentation pieces (`FormField`, `TextInput`, `TextArea`, `ErrorMessage`) keep markup consistent. A nested form shape keeps step boundaries clear:

```ts
{
  userInfo: { name, phone, email },
  requestItems: [{ serviceName, description, quantity }]
}
```

The dynamic list uses `useFieldArray`; new services are **prepended** (newest on top) and each row is keyed by the field's stable `id`. After each step change, `useStepFocus` moves focus to the new step heading for keyboard and screen-reader users.

### State management

| Concern | Owner |
| --- | --- |
| Input values | React Hook Form |
| Current step / navigation | React Context |
| Submit / success / error UI | Local component state |
| Draft persistence | `useDraftStorage` hook + LocalStorage |

Form data is **not duplicated** in context. Hidden steps remain registered because `shouldUnregister: false`.

## Validation

- Shared Zod schema; email/phone use the RegEx patterns in `src/constants/validation.ts`
  - Email: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  - Phone: `/^\+?[0-9\s()-]{7,20}$/`
- Step 1: name (required, min 2 chars), phone, email
- Step 2: each service row validates name/description/quantity; an empty list is allowed
- `mode: "onBlur"` — first validation on blur
- `reValidateMode: "onChange"` — corrections update errors while typing

## Submission

- Submit is only reachable on the Review step; `Enter` on earlier steps never submits
- The Submit button is disabled while submitting to prevent duplicate requests
- On success: the draft is cleared, the form resets, and a success screen is shown
- On failure: the draft is preserved and an error message is displayed

## Draft Persistence

- **Key:** `si-application-wizard-draft`
- **Stored shape:** `{ version, currentStep, formData, updatedAt }`
- Restored once on mount via `reset()` and `setCurrentStep()`
- Writes are debounced (~500ms); the latest step is also saved immediately before navigation
- Cleared **only after a successful submission**; failed submissions keep the draft
- Corrupt, invalid-shape, version-mismatched, or expired drafts (7-day TTL) are actively cleared on load

## Mobile Viewport & Keyboard Handling

- Layout height tracks `window.visualViewport` through the `--visual-viewport-height` CSS variable with a smooth transition
- `interactive-widget=resizes-content` in the viewport meta lets supporting browsers shrink content when the keyboard opens
- The sticky footer stays inside the visible viewport instead of hiding behind the keyboard
- On focus for every editable field (text, tel, email, textarea, number), the field is scrolled clear of the footer
- Visibility is re-checked after keyboard-settle delays and on viewport resize
- `16px` inputs prevent iOS focus zoom; safe-area padding protects the footer on devices with a home indicator

## Automated Tests

```bash
npm run test
```

Coverage includes:

1. Step validation blocks invalid navigation
2. Invalid email / phone RegEx rejection (UI and schema)
3. Valid navigation from step 1 to step 2
4. Focus moves to the next step heading
5. Dynamic add / edit / remove service items (newest first)
6. Review summary reflects earlier steps
7. `Enter` on earlier steps does not submit
8. Draft restoration from LocalStorage
9. Corrupt LocalStorage drafts are cleared safely
10. Successful submission clears LocalStorage
11. Failed submission preserves the draft
12. Expired / version-mismatched / invalid-shape draft cleanup
13. Mobile keyboard `visualViewport` resize + focus-scroll across field types

## Deployment

```bash
npm run build
```

Deploy the `dist` folder to Vercel or Netlify, then test on a physical mobile device to verify the virtual keyboard behavior and sticky footer.

## Technical Note (Assessment Summary)

**Form schemas without component bloat:** One React Hook Form instance owns all values, a single Zod schema centralizes validation, steps consume shared context through `FormProvider`, and `trigger()` enforces linear step progression — so no form state is duplicated into React Context and steps avoid prop drilling.

**Cross-device viewport recalculation:** The layout binds its height to a `visualViewport`-driven CSS variable, keeps the content region scrollable with a sticky footer, and re-runs a focus-visibility check (with keyboard-settle retries and resize listeners) so inputs stay above the keyboard and action bar on mobile browsers and WebViews.
