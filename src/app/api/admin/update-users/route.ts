import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../lib/models/User';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await User.findById((session.user as any).id);
    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Acceso denegado - Se requieren permisos de administrador' }, { status: 403 });
    }

    await dbConnect();

    // Actualizar usuarios que no tienen fecha de registro
    const result = await User.updateMany(
      { createdAt: { $exists: false } },
      { $set: { createdAt: new Date() } }
    );

    return NextResponse.json({ 
      success: true, 
      message: `${result.modifiedCount} usuarios actualizados`,
      modifiedCount: result.modifiedCount 
    });

  } catch (error: any) {
    console.error('Error actualizando usuarios:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
} 