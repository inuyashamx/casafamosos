import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar variables de entorno
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_UPLOAD_PRESET) {
      console.error('Missing Cloudinary environment variables');
      return NextResponse.json({ error: 'Configuración de Cloudinary faltante' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'image' or 'video'

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // Validar tipo de archivo
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

    if (type === 'image' && !allowedImageTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de imagen no permitido' }, { status: 400 });
    }

    if (type === 'video' && !allowedVideoTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de video no permitido' }, { status: 400 });
    }

    // Validar tamaño
    const maxImageSize = 10 * 1024 * 1024; // 10MB para imágenes
    const maxVideoSize = 100 * 1024 * 1024; // 100MB para videos

    if (type === 'image' && file.size > maxImageSize) {
      return NextResponse.json({ error: 'La imagen es demasiado grande (máximo 10MB)' }, { status: 400 });
    }

    if (type === 'video' && file.size > maxVideoSize) {
      return NextResponse.json({ error: 'El video es demasiado grande (máximo 100MB)' }, { status: 400 });
    }

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Subir a Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: type === 'video' ? 'video' : 'image',
          upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
          folder: `casafamosos/posts/${type}s`,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });

    const result = await uploadPromise as any;

    // Preparar respuesta
    const response = {
      public_id: result.public_id,
      secure_url: result.secure_url,
      resource_type: result.resource_type,
      format: result.format,
      width: result.width,
      height: result.height,
      duration: result.duration,
    };

    // Para videos, generar thumbnail
    if (type === 'video') {
      const thumbnailUrl = cloudinary.url(result.public_id, {
        resource_type: 'video',
        format: 'jpg',
        crop: 'fill',
        width: 400,
        height: 300,
        start_offset: '0',
      });
      
      response.thumbnail = thumbnailUrl;
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error en POST /api/upload:', error);
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 });
  }
}