import { normalizeAlKamelFeed, type NormalizedAlKamelFeed } from '@/lib/alkamel/normalize'

function getAuthorizationHeader(): string | undefined {
  const authType = process.env.ALKAMEL_AUTH_TYPE?.toLowerCase()
  if (authType === 'bearer' && process.env.ALKAMEL_BEARER_TOKEN) {
    return `Bearer ${process.env.ALKAMEL_BEARER_TOKEN}`
  }
  if (authType === 'basic' && process.env.ALKAMEL_USERNAME && process.env.ALKAMEL_PASSWORD) {
    const credentials = Buffer.from(`${process.env.ALKAMEL_USERNAME}:${process.env.ALKAMEL_PASSWORD}`).toString('base64')
    return `Basic ${credentials}`
  }
  return undefined
}

export async function fetchAlKamelLiveFeed(series: string): Promise<NormalizedAlKamelFeed> {
  const feedUrl = process.env.ALKAMEL_LIVE_FEED_URL
  if (!feedUrl) throw new Error('ALKAMEL_LIVE_FEED_URL is not configured')

  const parsedUrl = new URL(feedUrl)
  if (parsedUrl.protocol !== 'https:') throw new Error('ALKAMEL_LIVE_FEED_URL must use HTTPS')

  const authorization = getAuthorizationHeader()
  const response = await fetch(parsedUrl, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      ...(authorization ? { Authorization: authorization } : {}),
    },
    signal: AbortSignal.timeout(8_000),
  })

  if (!response.ok) throw new Error(`Al Kamel feed returned HTTP ${response.status}`)
  return normalizeAlKamelFeed(await response.json(), series)
}
