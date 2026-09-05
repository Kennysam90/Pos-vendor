import { useEffect, useState } from 'react'

interface Advert { title: string; message: string; color: string }

const ADVERTS: Advert[] = [
  { title: 'Low Float Alert', message: 'Top up your POS machines before you run out of cash', color: 'bg-amber-50 border-amber-200 text-amber-800' },
  { title: 'Daily Target', message: 'Track your daily earnings and stay on top of your goals', color: 'bg-brand-50 border-brand-200 text-brand-800' },
  { title: 'Customer Credit', message: 'Monitor outstanding credits and follow up on repayments', color: 'bg-rose-50 border-rose-200 text-rose-800' },
]

export function AdvertSlider() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % ADVERTS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const a = ADVERTS[index]

  return (
    <div className={`rounded-xl border p-4 transition-all duration-300 ${a.color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{a.title}</p>
          <p className="text-xs mt-0.5 opacity-80">{a.message}</p>
        </div>
        <div className="flex items-center gap-1">
          {ADVERTS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 opacity-80' : 'w-1.5 opacity-40'}`}
              style={{ background: 'currentColor' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
