import crypto from 'crypto';

export interface DeviceFingerprint {
  userAgent: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  platform?: string;
  cookieEnabled?: boolean;
  hash?: string;
}

export function generateFingerprintHash(data: DeviceFingerprint): string {
  const str = `${data.userAgent}-${data.screenResolution}-${data.timezone}-${data.language}-${data.platform}`;
  return crypto.createHash('sha256').update(str).digest('hex');
}

export function detectSuspiciousActivity(
  timeOnPage: number,
  votedAt: Date,
  accountCreatedAt?: Date
): {
  rapidVoting: boolean;
  unusualTime: boolean;
  newAccount: boolean;
} {
  // Detectar voto muy rápido (menos de 3 segundos en la página)
  const rapidVoting = timeOnPage < 3;

  // Detectar horario sospechoso (3-6 AM hora local)
  const hour = votedAt.getHours();
  const unusualTime = hour >= 3 && hour <= 6;

  // Detectar cuenta nueva (menos de 7 días)
  let newAccount = false;
  if (accountCreatedAt) {
    const accountAge = Date.now() - accountCreatedAt.getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    newAccount = accountAge < sevenDays;
  }

  return {
    rapidVoting,
    unusualTime,
    newAccount,
  };
}

export async function checkMultipleAccounts(
  deviceHash: string,
  userId: string,
  VoteLogModel: any
): Promise<boolean> {
  // Buscar otros usuarios que hayan usado el mismo dispositivo en las últimas 24 horas
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const otherAccounts = await VoteLogModel.find({
    'deviceFingerprint.hash': deviceHash,
    userId: { $ne: userId },
    votedAt: { $gte: oneDayAgo },
  }).distinct('userId');

  return otherAccounts.length > 0;
}

export function parseUserAgent(userAgent: string): {
  browser: string;
  os: string;
  isMobile: boolean;
} {
  const browser = userAgent.includes('Chrome') ? 'Chrome' :
                  userAgent.includes('Firefox') ? 'Firefox' :
                  userAgent.includes('Safari') ? 'Safari' :
                  userAgent.includes('Edge') ? 'Edge' : 'Other';

  const os = userAgent.includes('Windows') ? 'Windows' :
             userAgent.includes('Mac') ? 'Mac' :
             userAgent.includes('Linux') ? 'Linux' :
             userAgent.includes('Android') ? 'Android' :
             userAgent.includes('iOS') ? 'iOS' : 'Other';

  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);

  return { browser, os, isMobile };
}