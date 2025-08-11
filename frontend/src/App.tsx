import React from 'react'
import axios from 'axios'
import { Stepper } from './components/Stepper'
import { Loading } from './components/Loading'
import { MarkdownRenderer } from './components/MarkdownRenderer'

interface GroupInfo {
  total_persons: number
  children: number[]
  seniors: number[]
  destination_hint?: string
  days?: number
  budget_level?: 'low' | 'medium' | 'high'
}

type StepId = 'group' | 'children' | 'seniors' | 'details' | 'result'

const steps = [
  { id: 'group', label: 'Group' },
  { id: 'children', label: 'Children' },
  { id: 'seniors', label: 'Seniors' },
  { id: 'details', label: 'Details' },
  { id: 'result', label: 'Plan' },
] as const

export function App() {
  const [activeStep, setActiveStep] = React.useState<number>(0)
  const [form, setForm] = React.useState<GroupInfo>({ total_persons: 1, children: [], seniors: [] })
  const [totalPersonsText, setTotalPersonsText] = React.useState<string>('')
  const [includeChildren, setIncludeChildren] = React.useState<boolean>(false)
  const [includeSeniors, setIncludeSeniors] = React.useState<boolean>(false)
  const [loading, setLoading] = React.useState<boolean>(false)
  const [plan, setPlan] = React.useState<string>('')
  const [error, setError] = React.useState<string>('')
  const groupValid = React.useMemo(() => {
    const parsed = Number(totalPersonsText)
    return (totalPersonsText === '' && form.total_persons >= 1) || (Number.isFinite(parsed) && parsed >= 1)
  }, [totalPersonsText, form.total_persons])

  const stepOrder: StepId[] = React.useMemo(() => {
    const arr: StepId[] = ['group']
    if (includeChildren) arr.push('children')
    if (includeSeniors) arr.push('seniors')
    arr.push('details', 'result')
    return arr
  }, [includeChildren, includeSeniors])

  const currentStepId = stepOrder[activeStep]

  const goNext = async () => {
    if (currentStepId !== 'result') {
      setActiveStep(s => Math.min(s + 1, stepOrder.length - 1))
    }
    if (currentStepId === 'details') {
      await submit()
    }
  }

  const goBack = () => {
    setActiveStep(s => Math.max(s - 1, 0))
  }

  const submit = async () => {
    setLoading(true)
    setError('')
    setPlan('')
    try {
      const res = await axios.post('/api/plan', form)
      setPlan(res.data.plan)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Something went wrong')
    } finally {
      setLoading(false)
      setActiveStep(stepOrder.length - 1)
    }
  }

  const stepsUi = stepOrder.map(id => ({ id, label: steps.find(s => s.id === id)!.label }))

  return (
    <div className="container-nice">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-brand-900">Travel Planner</h1>
        <p className="text-brand-700 mt-1">Thoughtful itineraries for families and seniors</p>
      </div>

      <div className="card p-6 md:p-8">
        <Stepper steps={stepsUi as any} activeStep={activeStep} />

        {currentStepId === 'group' && (
          <div className="space-y-6">
            <div>
              <label className="label">How many persons are traveling?</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="input"
                placeholder="Enter total number"
                value={totalPersonsText}
                onChange={(e) => {
                  const next = e.target.value.replace(/[^0-9]/g, '')
                  setTotalPersonsText(next)
                  const parsed = Number(next)
                  if (Number.isFinite(parsed) && parsed >= 1) {
                    setForm(f => ({ ...f, total_persons: parsed }))
                  }
                }}
              />
              <p className="text-xs text-brand-600 mt-1">Only digits allowed. Minimum 1.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <input id="children" type="checkbox" className="h-4 w-4" checked={includeChildren} onChange={(e) => setIncludeChildren(e.target.checked)} />
                <label htmlFor="children">Traveling with children?</label>
              </div>
              <div className="flex items-center gap-3">
                <input id="seniors" type="checkbox" className="h-4 w-4" checked={includeSeniors} onChange={(e) => setIncludeSeniors(e.target.checked)} />
                <label htmlFor="seniors">Traveling with senior citizens?</label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button className="btn btn-primary" disabled={!groupValid} onClick={goNext}>Next</button>
            </div>
          </div>
        )}

        {currentStepId === 'children' && (
          <div className="space-y-6">
            <p className="text-brand-700">Enter ages of children (one per line)</p>
            <AgeList
              values={form.children}
              onChange={(vals) => setForm(f => ({ ...f, children: vals }))}
            />
            <div className="flex justify-between gap-3">
              <button className="btn btn-secondary" onClick={goBack}>Back</button>
              <button className="btn btn-primary" onClick={goNext}>Next</button>
            </div>
          </div>
        )}

        {currentStepId === 'seniors' && (
          <div className="space-y-6">
            <p className="text-brand-700">Enter ages of senior citizens (one per line)</p>
            <AgeList
              values={form.seniors}
              onChange={(vals) => setForm(f => ({ ...f, seniors: vals }))}
            />
            <div className="flex justify-between gap-3">
              <button className="btn btn-secondary" onClick={goBack}>Back</button>
              <button className="btn btn-primary" onClick={goNext}>Next</button>
            </div>
          </div>
        )}

        {currentStepId === 'details' && (
          <div className="space-y-6">
            <div>
              <label className="label">Destination (optional)</label>
              <input className="input" placeholder="e.g., Singapore, Goa, Switzerland" value={form.destination_hint ?? ''} onChange={e => setForm(f => ({ ...f, destination_hint: e.target.value }))} />
            </div>
            <div>
              <label className="label">Trip length in days (optional)</label>
              <input type="number" min={1} className="input" value={form.days ?? ''} onChange={e => setForm(f => ({ ...f, days: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div>
              <label className="label">Budget level (optional)</label>
              <select className="input" value={form.budget_level ?? ''} onChange={e => setForm(f => ({ ...f, budget_level: (e.target.value || undefined) as any }))}>
                <option value="">Select</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex justify-between gap-3">
              <button className="btn btn-secondary" onClick={goBack}>Back</button>
              <button className="btn btn-primary" onClick={goNext}>Generate Plan</button>
            </div>
          </div>
        )}

        {currentStepId === 'result' && (
          <div className="space-y-6">
            {loading ? (
              <Loading />
            ) : (
              <div>
                {error ? (
                  <div className="p-4 rounded-xl bg-red-50 text-red-700 border border-red-200">{error}</div>
                ) : (
                  <div className="prose prose-slate max-w-none">
                    <MarkdownRenderer content={plan} />
                  </div>
                )}
                <div className="flex justify-end mt-6">
                  <button className="btn btn-primary" onClick={() => { setActiveStep(0); setPlan(''); setError(''); }}>Plan another</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="text-center text-sm text-brand-600 mt-6">Made with care ✈️</footer>
    </div>
  )
}

function AgeList({ values, onChange }: { values: number[]; onChange: (vals: number[]) => void }) {
  const [text, setText] = React.useState(values.join('\n'))
  React.useEffect(() => {
    setText(values.join('\n'))
  }, [values])

  const commit = (t: string) => {
    const parsed = t
      .split(/\n+/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter(n => Number.isFinite(n) && n >= 0 && n <= 120)
    onChange(parsed)
  }

  return (
    <textarea
      className="input min-h-[120px]"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      placeholder={'e.g.\n7\n12'}
    />
  )
}
