import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let limiter: Ratelimit | null | undefined

function getLimiter() {
  if (limiter !== undefined) return limiter
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    limiter = null
    return limiter
  }
  limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, '1 h'),
    prefix: 'apexis:v1',
  })
  return limiter
}

export async function checkApiKeyRateLimit(keyId: string) {
  const rateLimit = getLimiter()
  if (!rateLimit) return null
  return rateLimit.limit(keyId)
}
