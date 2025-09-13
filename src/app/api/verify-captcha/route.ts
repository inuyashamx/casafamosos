import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }

    const hcaptchaSecret = process.env.HCAPTCHA_SECRET_KEY;
    if (!hcaptchaSecret) {
      return NextResponse.json({ error: 'Configuración de CAPTCHA no válida' }, { status: 500 });
    }

    // Verificar el token con hCaptcha
    const verifyResponse = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: hcaptchaSecret,
        response: token,
        remoteip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      }),
    });

    const result = await verifyResponse.json();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'CAPTCHA verificado correctamente',
        timestamp: Date.now()
      });
    } else {
      return NextResponse.json({
        error: 'CAPTCHA inválido',
        errorCodes: result['error-codes'] || []
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error verificando CAPTCHA:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}