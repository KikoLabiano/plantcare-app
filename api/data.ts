import type { VercelRequest, VercelResponse } from '@vercel/node'
import { list, put, del } from '@vercel/blob'

const BLOB_PREFIX = 'plantcare-data-'
const EMPTY_DATA = JSON.stringify({ plants: [], wateringRecords: [], pushSubscriptions: [] })

async function getLatestBlob() {
  const { blobs } = await list({ prefix: BLOB_PREFIX })
  if (blobs.length === 0) {
    return null
  }
  // Sort by uploadedAt descending
  blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
  return blobs[0]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Simple PIN auth check
  const token = req.headers['x-home-token']
  if (token !== process.env.HOME_PIN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    const latest = await getLatestBlob()
    if (!latest) {
      // Create initial
      const blob = await put(`${BLOB_PREFIX}initial.json`, EMPTY_DATA, {
        access: 'public',
        contentType: 'application/json',
      })
      return res.status(200).json(JSON.parse(EMPTY_DATA))
    }
    
    // Fetch from the unique URL (never cached stale since URL is unique)
    const fetchRes = await fetch(latest.url)
    const data = await fetchRes.json()
    return res.status(200).json(data)
  }

  if (req.method === 'PUT') {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)

    // Put new version
    await put(`${BLOB_PREFIX}v.json`, body, {
      access: 'public',
      contentType: 'application/json',
      // By default addRandomSuffix is true, creating a unique URL
    })

    // Cleanup old versions asynchronously
    // We don't await the cleanup to respond faster
    getLatestBlob().then(async () => {
      const { blobs } = await list({ prefix: BLOB_PREFIX })
      blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      // Keep only the most recent one
      if (blobs.length > 1) {
        const toDelete = blobs.slice(1).map(b => b.url)
        await del(toDelete)
      }
    }).catch(console.error)

    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
