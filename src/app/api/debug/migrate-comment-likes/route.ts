import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Post from '@/lib/models/Post';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar si es admin (puedes ajustar esta lógica según tu sistema de roles)
    if ((session.user as any).email !== 'admin@example.com') {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });
    }

    await dbConnect();

    // Buscar todos los posts que tengan comentarios sin el campo likes
    const posts = await Post.find({
      'comments': { $exists: true, $ne: [] }
    });

    let updatedCount = 0;

    for (const post of posts) {
      let postUpdated = false;
      
      for (const comment of post.comments) {
        if (!comment.likes) {
          comment.likes = [];
          postUpdated = true;
        }
      }

      if (postUpdated) {
        await post.save();
        updatedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Migración completada. ${updatedCount} posts actualizados.` 
    });

  } catch (error: any) {
    console.error('Error en migración de likes de comentarios:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 