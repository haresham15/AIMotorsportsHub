'use client' // Error components must be Client Components

import { useEffect } from 'react'
import Link from 'next/link'
import ApexisLogo from '@/components/ui/ApexisLogo'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App-level error caught:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-50 p-6 text-center">
      <ApexisLogo className="w-16 h-16 mb-6 opacity-50" />
      <h2 className="text-3xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-slate-400 mb-8 max-w-md">
        We encountered an unexpected error while trying to render this page. Our telemetry systems have been alerted.
      </p>
      <div className="flex gap-4">
        <button
          className="btn-primary px-6 py-2 rounded-md"
          onClick={() => reset()}
        >
          Try again
        </button>
        <Link href="/" className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-md transition text-sm font-medium flex items-center">
          Return Home
        </Link>
      </div>
    </div>
  )
}
