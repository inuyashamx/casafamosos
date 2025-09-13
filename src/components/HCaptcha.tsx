"use client";

import { useRef, useImperativeHandle, forwardRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

export interface HCaptchaRef {
  execute: () => void;
  resetCaptcha: () => void;
}

interface HCaptchaComponentProps {
  sitekey: string;
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact';
}

const HCaptchaComponent = forwardRef<HCaptchaRef, HCaptchaComponentProps>(({
  sitekey,
  onVerify,
  onError,
  onExpire,
  theme = 'light',
  size = 'normal'
}, ref) => {
  const hcaptchaRef = useRef<HCaptcha>(null);

  useImperativeHandle(ref, () => ({
    execute: () => {
      hcaptchaRef.current?.execute();
    },
    resetCaptcha: () => {
      hcaptchaRef.current?.resetCaptcha();
    }
  }));

  return (
    <HCaptcha
      ref={hcaptchaRef}
      sitekey={sitekey}
      onVerify={onVerify}
      onError={onError}
      onExpire={onExpire}
      theme={theme}
      size={size}
    />
  );
});

HCaptchaComponent.displayName = 'HCaptchaComponent';

export default HCaptchaComponent;