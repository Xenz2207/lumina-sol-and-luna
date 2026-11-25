import QRCode from 'qrcode';

export async function GET(request) {
  try {
    const reqUrl = new URL(request.url);
    const target = reqUrl.searchParams.get('url') || '';
    if (!target || target.length > 256) {
      return Response.json({ error: 'Invalid url parameter' }, { status: 400 });
    }

    let parsedTarget;
    try {
      parsedTarget = new URL(target);
    } catch {
      return Response.json({ error: 'Malformed url' }, { status: 400 });
    }

    if (parsedTarget.protocol !== 'http:' && parsedTarget.protocol !== 'https:') {
      return Response.json({ error: 'Unsupported protocol' }, { status: 400 });
    }

    const svg = await QRCode.toString(parsedTarget.toString(), {
      type: 'svg',
      margin: 1,
      width: 220,
      color: { dark: '#07131D', light: '#F0F6F7' },
    });

    return new Response(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('qr error:', err);
    return Response.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}
