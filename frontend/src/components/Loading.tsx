import React from 'react'

const phrases = [
  'Curating plan for you…',
  'Searching places for you to visit…',
  'Balancing kid-friendly and accessible options…',
  'Optimizing your itinerary…',
]

export function Loading() {
  const [index, setIndex] = React.useState(0)
  React.useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % phrases.length), 2000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center text-center py-16">
      <div className="w-16 h-16 border-4 border-slate-700 border-t-brand-500 rounded-full animate-spin mb-6" />
      <p className="text-lg text-slate-100">{phrases[index]}</p>
      <p className="text-sm text-slate-400 mt-2">This may take a few seconds…</p>
    </div>
  )
}
