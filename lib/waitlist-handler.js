import {
  getRedis,
  isDuplicateEmail,
  releaseEmail,
  reserveEmail,
} from './redis.js'

const ZAPIER_WEBHOOK_URL =
  'https://hooks.zapier.com/hooks/catch/10548864/4y3dpz9/'
const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const WAITLIST_SUCCESS = { ok: 'true' }

export const WAITLIST_DUPLICATE = {
  ok: 'true',
  message: "You're already on the waitlist.",
}

/**
 * @typedef {object} WaitlistEnv
 * @property {string} [TURNSTILE_SECRET_KEY]
 * @property {string} [UPSTASH_REDIS_REST_URL]
 * @property {string} [UPSTASH_REDIS_REST_TOKEN]
 */

/**
 * @typedef {object} WaitlistBody
 * @property {string} [email]
 * @property {string} [turnstileToken]
 * @property {string} [company]
 */

/**
 * @typedef {object} HandlerResult
 * @property {number} status
 * @property {Record<string, string>} body
 */

/**
 * @param {string} email
 * @returns {string}
 */
export function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

/**
 * @param {WaitlistBody} input
 * @param {WaitlistEnv} env
 * @returns {Promise<HandlerResult>}
 */
export async function handleWaitlistSubmission(input, env) {
  const email = typeof input.email === 'string' ? input.email.trim() : ''
  const turnstileToken =
    typeof input.turnstileToken === 'string' ? input.turnstileToken.trim() : ''

  if (!email || !EMAIL_PATTERN.test(email)) {
    return {
      status: 400,
      body: { error: 'Please enter a valid email address.' },
    }
  }

  if (!turnstileToken) {
    return {
      status: 400,
      body: {
        error: 'Please complete the verification check before joining the waitlist.',
      },
    }
  }

  const secretKey = env.TURNSTILE_SECRET_KEY
  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY is not configured')
    return {
      status: 500,
      body: {
        error: 'Waitlist is temporarily unavailable. Please try again in a moment.',
      },
    }
  }

  let turnstileOk = false
  try {
    const verifyResponse = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: turnstileToken,
      }),
    })

    if (!verifyResponse.ok) {
      throw new Error(`Turnstile verify HTTP ${verifyResponse.status}`)
    }

    const verifyResult = await verifyResponse.json()
    turnstileOk = verifyResult.success === true
  } catch (error) {
    console.error('Turnstile verification failed:', error)
    return {
      status: 503,
      body: {
        error:
          'We could not verify your submission right now. Please check your connection and try again.',
      },
    }
  }

  if (!turnstileOk) {
    return {
      status: 400,
      body: {
        error: 'Verification failed. Please complete the check and try again.',
      },
    }
  }

  const normalizedEmail = normalizeEmail(email)
  const redis = getRedis(env)

  if (redis) {
    if (await isDuplicateEmail(redis, normalizedEmail)) {
      return { status: 200, body: { ...WAITLIST_DUPLICATE } }
    }

    if (!(await reserveEmail(redis, normalizedEmail))) {
      return { status: 200, body: { ...WAITLIST_DUPLICATE } }
    }
  }

  try {
    const zapierResponse = await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      body: new URLSearchParams({ email }),
    })

    if (!zapierResponse.ok) {
      throw new Error(`Zapier HTTP ${zapierResponse.status}`)
    }
  } catch (error) {
    if (redis) {
      await releaseEmail(redis, normalizedEmail)
    }
    console.error('Zapier forwarding failed:', error)
    return {
      status: 502,
      body: {
        error: 'We could not add you to the waitlist right now. Please try again shortly.',
      },
    }
  }

  return { status: 200, body: { ...WAITLIST_SUCCESS } }
}
