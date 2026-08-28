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

  for (const sport of SERIES) {
    try {
      const response = await fetch(`${baseUrl}/api/ai/summary?series=${sport.id}`, {
        cache: 'force-cache',
        next: { revalidate: 300 } // Revalidate every 5 minutes
      })
      const data = await response.json()
      summaryMap[sport.id] = data.summary || 'Briefing not available right now — check back shortly.'
      
      // Stagger requests to prevent hitting free-tier Gemini API rate limits
      await new Promise(resolve => setTimeout(resolve, 800))
    } catch (e) {
      summaryMap[sport.id] = 'Briefing not available right now — check back shortly.'
    }
  }

  return summaryMap
}

export default async function Home() {
  // Fetch summaries on the server and pass to client component
  const summaries = await fetchSummaries()

  return <HomeClient summaries={summaries} />
}
