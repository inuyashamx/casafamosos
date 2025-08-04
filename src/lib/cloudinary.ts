import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format: string;
  width?: number;
  height?: number;
  duration?: number;
}

export class CloudinaryService {
  static async uploadImage(file: File): Promise<UploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET!);
      formData.append('resource_type', 'image');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Error uploading image to Cloudinary');
      }

      const data = await response.json();
      return {
        public_id: data.public_id,
        secure_url: data.secure_url,
        resource_type: data.resource_type,
        format: data.format,
        width: data.width,
        height: data.height,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image');
    }
  }

  static async uploadVideo(file: File): Promise<UploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET!);
      formData.append('resource_type', 'video');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Error uploading video to Cloudinary');
      }

      const data = await response.json();
      return {
        public_id: data.public_id,
        secure_url: data.secure_url,
        resource_type: data.resource_type,
        format: data.format,
        width: data.width,
        height: data.height,
        duration: data.duration,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload video');
    }
  }

  static async deleteMedia(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      return result.result === 'ok';
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  static getOptimizedUrl(publicId: string, options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
  } = {}): string {
    const {
      width,
      height,
      crop = 'fill',
      quality = 'auto',
      format = 'auto'
    } = options;

    let transformation = `q_${quality},f_${format}`;
    
    if (width || height) {
      transformation += `,c_${crop}`;
      if (width) transformation += `,w_${width}`;
      if (height) transformation += `,h_${height}`;
    }

    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${transformation}/${publicId}`;
  }

  static getVideoThumbnail(publicId: string, options: {
    width?: number;
    height?: number;
    quality?: string | number;
  } = {}): string {
    const {
      width = 400,
      height = 300,
      quality = 'auto'
    } = options;

    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/q_${quality},w_${width},h_${height},c_fill,so_0/${publicId}.jpg`;
  }
}

export default cloudinary;