'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Start loading animation
    setLoading(true)
    setProgress(30)

    const t1 = setTimeout(() => setProgress(60), 100)
    const t2 = setTimeout(() => setProgress(90), 200)
    const t3 = setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 150)
    }, 300)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [pathname, searchParams])

  if (!loading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[2px] pointer-events-none">
      <div
        className="h-full bg-[#003D2B] transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
