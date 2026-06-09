import type { VercelRequest, VercelResponse } from '@vercel/node'
import { head, put, del } from '@vercel/blob'

const BLOB_PATHNAME = 'plantcare-data.json'
const EMPTY_DATA = JSON.stringify({ plants: [], wateringRecords: [], pushSubscriptions: [] })

async function getOrCreateBlob(): Promise<{ url: string; data: object }> {
  try {
    const meta = await head(BLOB_PATHNAME)
    const res = await fetch(meta.url)
    const data = await res.json()
    return { url: meta.url, data }
  } catch {
    // Blob doesn't exist yet — create it
    const blob = await put(BLOB_PATHNAME, EMPTY_DATA, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    })
    return { url: blob.url, data: JSON.parse(EMPTY_DATA) }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Simple PIN auth check
  const token = req.headers['x-home-token']
  if (token !== process.env.HOME_PIN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    const { data } = await getOrCreateBlob()
    return res.status(200).json(data)
  }

  if (req.method === 'PUT') {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)

    await put(BLOB_PATHNAME, body, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    })

    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
