import { NextRequest, NextResponse } from 'next/server'
import { fetchAlKamelLiveFeed } from '@/lib/alkamel/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SUPPORTED_SERIES = new Set(['formula-e', 'gt-world-challenge', 'wec', 'elms', 'imsa'])

export async function GET(request: NextRequest) {
  const series = request.nextUrl.searchParams.get('series') ?? 'gt-world-challenge'
  if (!SUPPORTED_SERIES.has(series)) {
    return NextResponse.json({ error: `Unsupported Al Kamel series: ${series}` }, { status: 400 })
  }

  try {
    const feed = await fetchAlKamelLiveFeed(series)
    return NextResponse.json(feed, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Al Kamel feed error'
    const unconfigured = message.includes('not configured')
    console.error('Al Kamel live feed error:', message)
    return NextResponse.json(
      { error: unconfigured ? message : 'Al Kamel live feed unavailable' },
      { status: unconfigured ? 503 : 502 },
    )
  }
}
