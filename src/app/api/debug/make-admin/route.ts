import { NextRequest, NextResponse } from 'next/server';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    // Buscar usuario por email
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Hacer admin al usuario
    user.isAdmin = true;
    await user.save();

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin
      }
    });
  } catch (error: any) {
    console.error('Error en make-admin:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
} 