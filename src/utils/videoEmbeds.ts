export interface VideoEmbed {
  type: 'youtube' | 'tiktok' | 'facebook';
  url: string;
  embedUrl: string;
  videoId: string;
  thumbnail?: string;
}

export function extractVideoEmbeds(content: string): VideoEmbed[] {
  const embeds: VideoEmbed[] = [];

  // Regex para YouTube
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;

  // Regex para TikTok
  const tiktokRegex = /(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com\/@[^\/]+\/video\/(\d+)|vm\.tiktok\.com\/([a-zA-Z0-9]+))/g;

  // Regex para Facebook Reels
  const facebookRegex = /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:watch\/?\?v=|reel\/|[^\/]+\/videos\/)(\d+)/g;

  let match;

  // Extraer URLs de YouTube
  while ((match = youtubeRegex.exec(content)) !== null) {
    const videoId = match[1];
    embeds.push({
      type: 'youtube',
      url: match[0],
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      videoId,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    });
  }

  // Extraer URLs de TikTok
  while ((match = tiktokRegex.exec(content)) !== null) {
    const videoId = match[1] || match[2];
    const fullUrl = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
    embeds.push({
      type: 'tiktok',
      url: fullUrl,
      embedUrl: `https://www.tiktok.com/embed/v2/${videoId}?autoplay=1`,
      videoId
    });
  }

  // Extraer URLs de Facebook
  while ((match = facebookRegex.exec(content)) !== null) {
    const videoId = match[1];
    const fullUrl = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
    embeds.push({
      type: 'facebook',
      url: fullUrl,
      embedUrl: `https://www.facebook.com/plugins/video.php?height=314&href=${encodeURIComponent(fullUrl)}&show_text=false&width=560&t=0`,
      videoId
    });
  }

  return embeds;
}

export function removeVideoUrlsFromContent(content: string): string {
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})\S*/g;
  const tiktokRegex = /(?:https?:\/\/)?(?:www\.)?(?:tiktok\.com\/@[^\/]+\/video\/\d+|vm\.tiktok\.com\/[a-zA-Z0-9]+)\S*/g;
  const facebookRegex = /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:watch\/?\?v=|reel\/|[^\/]+\/videos\/)\d+\S*/g;

  return content
    .replace(youtubeRegex, '')
    .replace(tiktokRegex, '')
    .replace(facebookRegex, '')
    .replace(/\s+/g, ' ')
    .trim();
}