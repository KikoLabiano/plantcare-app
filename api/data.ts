import type { VercelRequest, VercelResponse } from '@vercel/node'
import { list, put, del } from '@vercel/blob'

const BLOB_PATHNAME = 'plantcare-data.json'
const EMPTY_DATA = JSON.stringify({ plants: [], wateringRecords: [], pushSubscriptions: [] })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Simple PIN auth check
  const token = req.headers['x-home-token']
  if (token !== process.env.HOME_PIN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    // List all blobs starting with 'plantcare-data'
    const { blobs } = await list({ prefix: 'plantcare-data' })

    if (blobs.length === 0) {
      // Create initial plantcare-data.json
      await put(BLOB_PATHNAME, EMPTY_DATA, {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
      })
      return res.status(200).json(JSON.parse(EMPTY_DATA))
    }

    // Sort by uploadedAt descending to get the absolute latest data
    blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())

    let data = null
    let latestBlob = null

    // Try to fetch blobs from newest to oldest until one succeeds
    for (const blob of blobs) {
      try {
        const fetchRes = await fetch(`${blob.url}?ts=${Date.now()}`, { cache: 'no-store' })
        if (!fetchRes.ok) {
          console.warn(`Failed to fetch blob ${blob.url}: status ${fetchRes.status}`)
          continue
        }
        data = await fetchRes.json()
        latestBlob = blob
        break // Succeeded!
      } catch (err) {
        console.error(`Error loading or parsing blob ${blob.url}:`, err)
      }
    }

    if (!data || !latestBlob) {
      // Fallback if all blobs failed or couldn't be parsed
      data = JSON.parse(EMPTY_DATA)
      await put(BLOB_PATHNAME, EMPTY_DATA, {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
      })
      return res.status(200).json(data)
    }

    // Consolidate/migrate if there are multiple files or if the newest isn't the main file
    const needsConsolidation = blobs.length > 1 || latestBlob.pathname !== BLOB_PATHNAME

    if (needsConsolidation) {
      // Overwrite the main file with the latest data
      await put(BLOB_PATHNAME, JSON.stringify(data), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
      })

      // Delete all blobs that are NOT the main BLOB_PATHNAME
      const toDelete = blobs
        .filter((b) => b.pathname !== BLOB_PATHNAME)
        .map((b) => b.url)

      if (toDelete.length > 0) {
        try {
          await del(toDelete)
        } catch (delErr) {
          console.error('Error deleting old blobs during consolidation:', delErr)
        }
      }
    }

    return res.status(200).json(data)
  }

  if (req.method === 'PUT') {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)

    // Overwrite the main blob directly
    await put(BLOB_PATHNAME, body, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
    })

    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

