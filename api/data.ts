import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'
import { list } from '@vercel/blob'

const DATA_KEY = 'plantcare:data'

interface PlantData {
  plants: unknown[]
  wateringRecords: unknown[]
  [key: string]: unknown
}

const EMPTY_DATA: PlantData = { plants: [], wateringRecords: [], pushSubscriptions: [] }

// Supports both env naming schemes: Upstash Marketplace integration
// (UPSTASH_REDIS_REST_*) and Vercel Redis storage, formerly KV (KV_REST_API_*).
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? '',
})

function isValidData(body: unknown): body is Pick<PlantData, 'plants' | 'wateringRecords'> {
  return (
    typeof body === 'object' &&
    body !== null &&
    Array.isArray((body as PlantData).plants) &&
    Array.isArray((body as PlantData).wateringRecords)
  )
}

// One-time migration: if Redis has no data yet, seed it from the legacy
// Vercel Blob file so existing plants/records are not lost.
async function migrateFromBlob(): Promise<PlantData | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null
  try {
    const { blobs } = await list({ prefix: 'plantcare-data' })
    blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
    for (const blob of blobs) {
      try {
        const res = await fetch(`${blob.url}?ts=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) continue
        const data = await res.json()
        if (isValidData(data)) return data as PlantData
      } catch (err) {
        console.error(`Error reading legacy blob ${blob.url}:`, err)
      }
    }
  } catch (err) {
    console.error('Legacy blob migration failed:', err)
  }
  return null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Simple PIN auth check
  const token = req.headers['x-home-token']
  if (token !== process.env.HOME_PIN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    let data = await redis.get<PlantData>(DATA_KEY)
    if (!data) {
      data = (await migrateFromBlob()) ?? EMPTY_DATA
      await redis.set(DATA_KEY, data)
    }
    return res.status(200).json(data)
  }

  if (req.method === 'PUT') {
    let body: unknown
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' })
    }

    if (!isValidData(body)) {
      return res.status(400).json({ error: 'Body must include plants[] and wateringRecords[]' })
    }

    // Merge over the stored object so fields the client does not manage
    // (e.g. pushSubscriptions) are preserved.
    const existing = (await redis.get<PlantData>(DATA_KEY)) ?? EMPTY_DATA
    await redis.set(DATA_KEY, { ...existing, ...body })

    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
