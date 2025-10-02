import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';
import Vote from '@/lib/models/Vote';
import Post from '@/lib/models/Post';
import Dedication from '@/lib/models/Dedication';
import Notification from '@/lib/models/Notification';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await request.json();
    const { confirmationText } = data;

    // Validar que se proporcione el texto de confirmación
    if (!confirmationText || typeof confirmationText !== 'string') {
      return NextResponse.json({ error: 'Texto de confirmación requerido' }, { status: 400 });
    }

    // El usuario debe escribir exactamente "ELIMINAR MI CUENTA" para confirmar
    if (confirmationText.trim() !== 'ELIMINAR MI CUENTA') {
      return NextResponse.json({ error: 'Texto de confirmación incorrecto' }, { status: 400 });
    }

    await connectToDatabase();

    const userId = (session.user as any).id;

    // Eliminar todos los votos del usuario
    await Vote.deleteMany({ userId });

    // Eliminar todos los posts del usuario (incluyendo comentarios anidados)
    await Post.deleteMany({ userId });

    // Eliminar todos los comentarios del usuario en otros posts
    await Post.updateMany(
      { 'comments.userId': userId },
      { $pull: { comments: { userId } } }
    );

    // Eliminar todas las dedicatorias del usuario
    await Dedication.deleteMany({ userId });

    // Eliminar todas las notificaciones del usuario
    await Notification.deleteMany({ userId });

    // Eliminar el usuario
    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      message: 'Cuenta eliminada exitosamente'
    });
  } catch (error: any) {
    console.error('Error en POST /api/user/delete:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
