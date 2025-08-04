import { NextResponse } from 'next/server';
import { SocialMediaService } from '@/lib/services/socialMediaService';

export async function GET() {
  try {
    const socialMedia = await SocialMediaService.getSocialMedia();
    
    return NextResponse.json({
      whatsapp: socialMedia.whatsapp,
      telegram: socialMedia.telegram,
      twitter: socialMedia.twitter,
      facebook: socialMedia.facebook,
      instagram: socialMedia.instagram,
      tiktok: socialMedia.tiktok,
    });
  } catch (error) {
    console.error('Error fetching social media:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 