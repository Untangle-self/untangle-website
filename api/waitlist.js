import { WAITLIST_SUCCESS, handleWaitlistSubmission } from '../lib/waitlist-handler.js'
import { getRedis, isRateLimitAllowed } from '../lib/redis.js'

const ALLOWED_ORIGINS = new Set([
  'https://www.untangleself.com',
  'https://untangleself.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

/**
 * @param {string | undefined} origin
 * @returns {Record<string, string>}
 */
function corsHeaders(origin) {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

/**
 * @param {import('http').IncomingMessage} req
 * @returns {string}
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(',')[0].trim()
  }
  return req.socket?.remoteAddress ?? 'unknown'
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export default async function handler(req, res) {
  const origin = req.headers.origin
  const cors = corsHeaders(origin)

  for (const [header, value] of Object.entries(cors)) {
    res.setHeader(header, value)
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = origin && !cors['Access-Control-Allow-Origin'] ? 403 : 204
    res.end()
    return
  }

  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  if (origin && !cors['Access-Control-Allow-Origin']) {
    res.statusCode = 403
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Origin not allowed' }))
    return
  }

  const body = req.body ?? {}

  if (typeof body.company === 'string' && body.company.trim()) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(WAITLIST_SUCCESS))
    return
  }

  console.log(
    '[waitlist:redis:diag] api/waitlist env keys:',
    Object.keys(process.env).filter((key) => /upstash|redis|kv/i.test(key)),
  )

  const redis = getRedis(process.env)
  if (redis) {
    const allowed = await isRateLimitAllowed(redis, getClientIp(req))
    if (!allowed) {
      res.statusCode = 429
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Too many submissions. Please try again later.' }))
      return
    }
  }

  const result = await handleWaitlistSubmission(body, process.env)

  res.statusCode = result.status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(result.body))
}
