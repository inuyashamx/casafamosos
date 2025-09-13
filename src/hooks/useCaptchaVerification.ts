import { useState, useCallback } from 'react';

interface CaptchaState {
  isRequired: boolean;
  isVerified: boolean;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface CaptchaVerificationHook {
  captchaState: CaptchaState;
  requireCaptcha: () => void;
  verifyCaptcha: (token: string) => Promise<boolean>;
  resetCaptcha: () => void;
  shouldShowCaptcha: () => boolean;
}

export function useCaptchaVerification(): CaptchaVerificationHook {
  const [captchaState, setCaptchaState] = useState<CaptchaState>({
    isRequired: false,
    isVerified: false,
    token: null,
    loading: false,
    error: null,
  });

  const requireCaptcha = useCallback(() => {
    setCaptchaState(prev => ({
      ...prev,
      isRequired: true,
      isVerified: false,
      token: null,
      error: null,
    }));
  }, []);

  const verifyCaptcha = useCallback(async (token: string): Promise<boolean> => {
    setCaptchaState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setCaptchaState(prev => ({
          ...prev,
          isVerified: true,
          token,
          loading: false,
          error: null,
        }));
        return true;
      } else {
        setCaptchaState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Error verificando CAPTCHA',
        }));
        return false;
      }
    } catch (error) {
      setCaptchaState(prev => ({
        ...prev,
        loading: false,
        error: 'Error de conexión',
      }));
      return false;
    }
  }, []);

  const resetCaptcha = useCallback(() => {
    setCaptchaState({
      isRequired: false,
      isVerified: false,
      token: null,
      loading: false,
      error: null,
    });
  }, []);

  const shouldShowCaptcha = useCallback(() => {
    return captchaState.isRequired && !captchaState.isVerified;
  }, [captchaState.isRequired, captchaState.isVerified]);

  return {
    captchaState,
    requireCaptcha,
    verifyCaptcha,
    resetCaptcha,
    shouldShowCaptcha,
  };
}