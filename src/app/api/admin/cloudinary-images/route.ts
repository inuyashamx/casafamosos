import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';
import User from '@/lib/models/User';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que sea admin desde la base de datos
    const user = await User.findById((session.user as { id: string }).id);
    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const resourceType = searchParams.get('type') || 'image'; // 'image' o 'video'

    // Obtener recursos de Cloudinary
    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: resourceType,
      prefix: 'casafamosos/', // Solo archivos de la aplicación
      max_results: limit,
      next_cursor: searchParams.get('next_cursor') || undefined,
    });

    // Formatear la respuesta
    const resources = result.resources.map((resource: any) => ({
      public_id: resource.public_id,
      secure_url: resource.secure_url,
      format: resource.format,
      width: resource.width,
      height: resource.height,
      bytes: resource.bytes,
      created_at: resource.created_at,
      resource_type: resource.resource_type,
      folder: resource.folder,
      filename: resource.filename,
      thumbnail_url: resource.resource_type === 'video' 
        ? cloudinary.url(resource.public_id, {
            resource_type: 'video',
            format: 'jpg',
            crop: 'fill',
            width: 200,
            height: 150,
            start_offset: '0',
          })
        : undefined,
    }));

    return NextResponse.json({
      resources,
      pagination: {
        next_cursor: result.next_cursor,
        has_more: !!result.next_cursor,
        total_count: result.total_count,
        page,
        limit,
      },
    });
  } catch (error: any) {
    console.error('Error en GET /api/admin/cloudinary-images:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

 