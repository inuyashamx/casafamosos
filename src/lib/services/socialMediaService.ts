import dbConnect from '@/lib/mongodb';
import SocialMedia from '@/lib/models/SocialMedia';

export class SocialMediaService {
  static async getSocialMedia() {
    await dbConnect();
    
    let socialMedia = await SocialMedia.findOne({ isActive: true });
    
    // Si no existe, crear uno por defecto
    if (!socialMedia) {
      socialMedia = new SocialMedia();
      await socialMedia.save();
    }
    
    return socialMedia;
  }

  static async updateSocialMedia(updates: {
    whatsapp?: string;
    telegram?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  }) {
    await dbConnect();
    
    let socialMedia = await SocialMedia.findOne({ isActive: true });
    
    // Si no existe, crear uno nuevo
    if (!socialMedia) {
      socialMedia = new SocialMedia();
    }
    
    // Actualizar campos si se proporcionan
    if (updates.whatsapp !== undefined) {
      socialMedia.whatsapp = updates.whatsapp || null;
    }
    if (updates.telegram !== undefined) {
      socialMedia.telegram = updates.telegram || null;
    }
    if (updates.twitter !== undefined) {
      socialMedia.twitter = updates.twitter || null;
    }
    if (updates.facebook !== undefined) {
      socialMedia.facebook = updates.facebook || null;
    }
    if (updates.instagram !== undefined) {
      socialMedia.instagram = updates.instagram || null;
    }
    if (updates.tiktok !== undefined) {
      socialMedia.tiktok = updates.tiktok || null;
    }
    
    await socialMedia.save();
    return socialMedia;
  }
} 