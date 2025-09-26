import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    // Usar la API oEmbed de TikTok para resolver la URL
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      throw new Error('Failed to resolve TikTok URL');
    }

    const data = await response.json();

    // Extraer el video ID del HTML devuelto
    let videoId = '';

    // Buscar el data-video-id en el HTML
    const videoIdMatch = data.html?.match(/data-video-id="(\d+)"/);
    if (videoIdMatch) {
      videoId = videoIdMatch[1];
    } else {
      // Intentar extraer del atributo cite
      const citeMatch = data.html?.match(/cite="https:\/\/www\.tiktok\.com\/@[^\/]+\/video\/(\d+)"/);
      if (citeMatch) {
        videoId = citeMatch[1];
      }
    }

    return NextResponse.json({
      videoId,
      title: data.title,
      author_name: data.author_name,
      author_url: data.author_url,
      thumbnail_url: data.thumbnail_url,
      embed_html: data.html
    });
  } catch (error) {
    console.error('Error resolving TikTok URL:', error);
    return NextResponse.json(
      { error: 'Failed to resolve TikTok URL' },
      { status: 500 }
    );
  }
}