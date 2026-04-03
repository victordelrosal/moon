// Cloudflare Worker: JPL Horizons CORS proxy for Artemis II tracker
// Only allows requests to ssd.jpl.nasa.gov

const ALLOWED_ORIGIN = [
  'https://victordelrosal.com',
  'https://www.victordelrosal.com',
  'http://localhost',
  'http://127.0.0.1',
];

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(
      ALLOWED_ORIGIN.some(o => origin.startsWith(o)) ? origin : ALLOWED_ORIGIN[0]
    );

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl || !targetUrl.startsWith('https://ssd.jpl.nasa.gov/')) {
      return new Response(JSON.stringify({ error: 'Only JPL Horizons requests allowed' }), {
        status: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    try {
      const resp = await fetch(targetUrl, {
        headers: { 'User-Agent': 'ArtemisII-Tracker/1.0' },
      });
      const body = await resp.text();
      return new Response(body, {
        status: resp.status,
        headers: {
          ...headers,
          'Content-Type': resp.headers.get('Content-Type') || 'application/json',
          'Cache-Control': 'public, max-age=30',
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 502,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
  },
};
