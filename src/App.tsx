import { WizardProvider } from './context/WizardContext'
import { ApplicationWizard } from './components/wizard/ApplicationWizard'

function App() {
  return (
    <WizardProvider>
      <div className="min-h-[var(--visual-viewport-height,100dvh)] bg-slate-100">
        <header className="border-b border-slate-200 bg-white px-4 py-4 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
            Application & Contract Request Wizard
          </h1>
        </header>
        <ApplicationWizard />
      </div>
    </WizardProvider>
  )
}

export default App
