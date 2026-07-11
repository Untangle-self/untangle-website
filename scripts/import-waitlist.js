import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRedis } from '../lib/redis.js'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const csvPath = resolve(rootDir, 'clean_waitlist.csv')

/**
 * @param {string} content
 * @returns {string[]}
 */
function readEmailColumn(content) {
  const lines = content.trim().split(/\r?\n/)
  if (lines.length === 0) return []

  const header = lines[0].split(',').map((cell) => cell.trim())
  const emailIndex = header.indexOf('Email')
  if (emailIndex === -1) {
    console.error('Email column not found in clean_waitlist.csv')
    process.exit(1)
  }

  const emails = []
  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(',')
    emails.push(columns[emailIndex] ?? '')
  }

  return emails
}

async function main() {
  const redis = getRedis(process.env)
  if (!redis) {
    console.error(
      'Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.',
    )
    process.exit(1)
  }

  const rows = readEmailColumn(readFileSync(csvPath, 'utf8'))

  let imported = 0
  let alreadyExisted = 0
  let skipped = 0

  for (const rawEmail of rows) {
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : ''
    if (!email) {
      skipped++
      continue
    }

    const key = `waitlist:email:${email}`
    const result = await redis.set(key, '1', { nx: true })

    if (result === 'OK') {
      imported++
    } else {
      alreadyExisted++
    }
  }

  console.log('Total rows:', rows.length)
  console.log('Imported:', imported)
  console.log('Already existed:', alreadyExisted)
  console.log('Skipped:', skipped)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
