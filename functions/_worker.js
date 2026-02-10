export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // API routes for R2 storage
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env);
    }

    // Serve static assets
    return env.ASSETS.fetch(request);
  }
};

async function handleAPI(request, env) {
  const url = new URL(request.url);
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // /api/data - get or update all incident data
  if (url.pathname === '/api/data') {
    if (request.method === 'GET') {
      const object = await env.R2_BUCKET.get('incidents.json');
      if (!object) {
        return new Response(JSON.stringify({}), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      const data = await object.text();
      return new Response(data, {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (request.method === 'PUT') {
      const data = await request.text();
      await env.R2_BUCKET.put('incidents.json', data, {
        httpMetadata: { contentType: 'application/json' }
      });
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }

  return new Response('Not found', { status: 404, headers: corsHeaders });
}
