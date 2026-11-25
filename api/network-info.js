export async function GET(request) {
  try {
    const reqUrl = new URL(request.url);
    const origin = reqUrl.origin;
    return Response.json(
      {
        port: 443,
        lanUrls: [origin],
        recommendedUrl: origin,
        platform: 'vercel',
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err) {
    console.error('network-info error:', err);
    return Response.json({ error: 'Failed to resolve network info' }, { status: 500 });
  }
}
