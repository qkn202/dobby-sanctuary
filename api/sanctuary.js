import { handleSanctuaryRequest } from '../server/sanctuaryBackendCore.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    let parsedBody = req.body || {};
    if (typeof parsedBody === 'string' && parsedBody.trim()) {
      try {
        parsedBody = JSON.parse(parsedBody);
      } catch {
        parsedBody = {};
      }
    }

    const result = await handleSanctuaryRequest({
      method: req.method || 'GET',
      query: req.query || {},
      body: parsedBody,
      env: process.env,
    });

    return res.status(result.status).json(result.payload);
  } catch (err) {
    console.error('[api/sanctuary] Unexpected error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Internal Sanctuary Backend Error',
    });
  }
}
