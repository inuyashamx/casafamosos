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
  accountCreatedAt?: Date,
  userAgent?: string,
  previousVotes?: any[]
): {
  rapidVoting: boolean;
  unusualTime: boolean;
  newAccount: boolean;
  suspiciousUserAgent: boolean;
  consistentVotingPattern: boolean;
  perfectTiming: boolean;
  sequentialVoting: boolean;
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

  // Detectar User-Agent sospechoso
  const suspiciousUserAgent = userAgent ? detectSuspiciousUserAgent(userAgent) : false;

  // Detectar patrones de voto consistentes (siempre mismos puntos, mismo tiempo)
  const consistentVotingPattern = previousVotes ? detectConsistentPattern(previousVotes, timeOnPage, votedAt) : false;

  // Detectar timing perfecto (demasiado preciso para ser humano)
  const perfectTiming = timeOnPage > 0 && timeOnPage < 1; // Menos de 1 segundo pero no instantáneo

  // Detectar voto secuencial (votos muy cercanos en tiempo)
  const sequentialVoting = previousVotes ? detectSequentialVoting(previousVotes, votedAt) : false;

  return {
    rapidVoting,
    unusualTime,
    newAccount,
    suspiciousUserAgent,
    consistentVotingPattern,
    perfectTiming,
    sequentialVoting,
  };
}

function detectSuspiciousUserAgent(userAgent: string): boolean {
  const suspiciousPatterns = [
    // Bots conocidos
    /bot|crawler|spider|scraper/i,
    // Herramientas de automatización
    /selenium|puppeteer|playwright|webdriver/i,
    // User agents muy genéricos o antiguos
    /^mozilla\/4\.0$/i,
    /^curl|wget|python/i,
    // Headless browsers
    /headless|phantom/i,
    // User agents demasiado nuevos (versiones que aún no existen)
    /chrome\/1[5-9][0-9]/i, // Versiones Chrome muy altas
  ];

  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

function detectConsistentPattern(previousVotes: any[], currentTimeOnPage: number, currentVoteTime: Date): boolean {
  if (!previousVotes || previousVotes.length < 3) return false;

  // Verificar si los últimos 3 votos tienen el mismo tiempo en página (±0.5 segundos)
  const recentVotes = previousVotes.slice(-3);
  const timeTolerance = 0.5;

  const timesOnPage = recentVotes.map(vote => vote.timeOnPage).filter(time => time !== undefined);
  if (timesOnPage.length < 2) return false;

  const averageTime = timesOnPage.reduce((sum, time) => sum + time, 0) / timesOnPage.length;
  const isConsistentTime = timesOnPage.every(time => Math.abs(time - averageTime) <= timeTolerance);

  // Verificar si votan siempre con la misma distribución de puntos
  const pointPatterns = recentVotes.map(vote => vote.points);
  const samePoints = pointPatterns.every(points => points === pointPatterns[0]);

  return isConsistentTime || samePoints;
}

function detectSequentialVoting(previousVotes: any[], currentVoteTime: Date): boolean {
  if (!previousVotes || previousVotes.length === 0) return false;

  const lastVote = previousVotes[previousVotes.length - 1];
  if (!lastVote.votedAt) return false;

  const timeDiff = currentVoteTime.getTime() - new Date(lastVote.votedAt).getTime();

  // Votos con menos de 10 segundos de diferencia son sospechosos
  return timeDiff < 10000;
}

// Nueva función para detectar coordinated voting
export function detectCoordinatedVoting(
  deviceHash: string,
  votingWindow: any[], // Votos en una ventana de tiempo específica
  timeWindowMinutes: number = 5
): {
  multipleAccountsCoordinated: boolean;
  suspiciousVoteDistribution: boolean;
  identicalVotingPatterns: boolean;
} {
  // Filtrar votos en la ventana de tiempo
  const cutoffTime = Date.now() - (timeWindowMinutes * 60 * 1000);
  const recentVotes = votingWindow.filter(vote =>
    new Date(vote.votedAt).getTime() > cutoffTime
  );

  // Detectar múltiples cuentas coordinadas
  const deviceVotes = recentVotes.filter(vote => vote.deviceFingerprint?.hash === deviceHash);
  const uniqueUsers = new Set(deviceVotes.map(vote => vote.userId)).size;
  const multipleAccountsCoordinated = uniqueUsers > 1 && deviceVotes.length > uniqueUsers * 2;

  // Detectar distribución sospechosa de votos (todos votan al mismo candidato)
  const candidateVotes = new Map();
  recentVotes.forEach(vote => {
    const count = candidateVotes.get(vote.candidateId) || 0;
    candidateVotes.set(vote.candidateId, count + 1);
  });

  const totalVotes = recentVotes.length;
  const maxCandidateVotes = Math.max(...candidateVotes.values());
  const suspiciousVoteDistribution = totalVotes > 5 && (maxCandidateVotes / totalVotes) > 0.8;

  // Detectar patrones de voto idénticos
  const votePatterns = recentVotes.map(vote => `${vote.candidateId}-${vote.points}`);
  const uniquePatterns = new Set(votePatterns).size;
  const identicalVotingPatterns = votePatterns.length > 3 && uniquePatterns === 1;

  return {
    multipleAccountsCoordinated,
    suspiciousVoteDistribution,
    identicalVotingPatterns,
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