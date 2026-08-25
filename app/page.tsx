import { SERIES } from '@/lib/data'
import HomeClient from '@/components/HomeClient'
import { headers } from 'next/headers'

// In a real app we'd fetch this from the database or cache.
// We're making server-side fetch calls here to pre-render the AI summaries.
async function fetchSummaries() {
  const summaryMap: Record<string, string> = {}
  
  // Need the full URL for absolute fetching in server components
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  const summaryPromises = SERIES.map(async (sport) => {
    try {
      const response = await fetch(`${baseUrl}/api/ai/summary?series=${sport.id}`, {
        cache: 'force-cache',
        next: { revalidate: 300 } // Revalidate every 5 minutes
      })
      const data = await response.json()
      return { id: sport.id, summary: data.summary || 'Loading summary...' }
    } catch (e) {
      return { id: sport.id, summary: 'Unable to load summary at this time.' }
    }
  })

  const results = await Promise.all(summaryPromises)
  results.forEach(({ id, summary }) => {
    summaryMap[id] = summary
  })

  return summaryMap
}

export default async function Home() {
  // Fetch summaries on the server and pass to client component
  const summaries = await fetchSummaries()

  return <HomeClient summaries={summaries} />
}
