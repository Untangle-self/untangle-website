import { handleWaitlistSubmission } from '../lib/waitlist-handler.js'

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

  const result = await handleWaitlistSubmission(req.body ?? {}, process.env)

  res.statusCode = result.status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(result.body))
}
