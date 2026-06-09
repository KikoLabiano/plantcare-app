import type { VercelRequest, VercelResponse } from '@vercel/node'
import { list, put } from '@vercel/blob'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { blobs } = await list()
    const oldBlob = blobs.find(b => b.pathname === 'plantcare-data.json')
    if (!oldBlob) {
      return res.status(404).json({ error: 'Old blob not found' })
    }
    
    const r = await fetch(oldBlob.url)
    const oldData = await r.json()
    
    await put(`plantcare-data-recovered.json`, JSON.stringify(oldData), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: true
    })

    return res.status(200).json({ ok: true, plantsRecovered: oldData.plants?.length })
  } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }
}
