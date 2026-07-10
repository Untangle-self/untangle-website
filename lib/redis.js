import { Redis } from '@upstash/redis'

/** @type {Redis | null} */
let client = null

/**
 * @param {Record<string, string | undefined>} env
 * @returns {Redis | null}
 */
export function getRedis(env) {
  const url = env.UPSTASH_REDIS_REST_URL
  const token = env.UPSTASH_REDIS_REST_TOKEN

  console.log('[waitlist:redis:diag] UPSTASH_REDIS_REST_URL exists:', !!url)
  console.log('[waitlist:redis:diag] UPSTASH_REDIS_REST_TOKEN exists:', !!token)

  if (!url || !token) {
    console.log('[waitlist:redis:diag] getRedis() returned a client:', false)
    return null
  }

  if (!client) {
    client = new Redis({ url, token })
  }

  console.log('[waitlist:redis:diag] getRedis() returned a client:', true)
  return client
}

/**
 * @param {import('@upstash/redis').Redis} redis
 * @param {string} ip
 * @returns {Promise<boolean>} true when the request is allowed
 */
export async function isRateLimitAllowed(redis, ip) {
  const key = `waitlist:ratelimit:${ip}`

  try {
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, 3600)
    }
    return count <= 5
  } catch (error) {
    console.error('Rate limit check failed:', error)
    return true
  }
}

/**
 * @param {import('@upstash/redis').Redis} redis
 * @param {string} email
 * @returns {Promise<boolean>} true when the email is already registered
 */
export async function isDuplicateEmail(redis, email) {
  const key = `waitlist:email:${email}`

  try {
    return (await redis.exists(key)) === 1
  } catch (error) {
    console.error('Duplicate check failed:', error)
    return false
  }
}

/**
 * @param {import('@upstash/redis').Redis} redis
 * @param {string} email
 * @returns {Promise<boolean>} true when the email was newly reserved
 */
export async function reserveEmail(redis, email) {
  const key = `waitlist:email:${email}`

  try {
    const result = await redis.set(key, '1', { nx: true })
    return result === 'OK'
  } catch (error) {
    console.error('Email reservation failed:', error)
    return true
  }
}

/**
 * @param {import('@upstash/redis').Redis} redis
 * @param {string} email
 */
export async function releaseEmail(redis, email) {
  const key = `waitlist:email:${email}`

  try {
    await redis.del(key)
  } catch (error) {
    console.error('Email release failed:', error)
  }
}
