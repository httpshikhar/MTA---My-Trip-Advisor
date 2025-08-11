import React from 'react'
import clsx from 'clsx'

export type Step = {
  id: string
  label: string
}

export function Stepper({ steps, activeStep }: { steps: Step[]; activeStep: number }) {
  return (
    <ol className="flex items-center w-full mb-6">
      {steps.map((step, idx) => (
        <li key={step.id} className={clsx('flex-1 relative flex items-center', idx !== steps.length - 1 && 'pr-6')}>
          <div className={clsx(
            'flex items-center',
            'z-10'
          )}>
            <div className={clsx(
              'w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-semibold shadow',
              idx <= activeStep ? 'bg-brand-500' : 'bg-slate-700'
            )}>{idx + 1}</div>
            <span className={clsx('ml-3 text-sm font-medium', idx <= activeStep ? 'text-slate-100' : 'text-slate-400')}>{step.label}</span>
          </div>
          {idx !== steps.length - 1 && (
            <div className={clsx('absolute left-0 right-0 top-4 h-0.5', idx < activeStep ? 'bg-brand-500' : 'bg-slate-700')} style={{ transform: 'translateY(-50%)' }} />
          )}
        </li>
      ))}
    </ol>
  )
}
