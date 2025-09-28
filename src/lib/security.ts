/**
 * Security utilities for XSS prevention and HTML sanitization
 */

/**
 * Escapes HTML characters to prevent XSS attacks
 * @param str - The string to escape
 * @returns The escaped string safe for HTML insertion
 */
export function escapeHtml(str: string): string {
  const htmlEscapes: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return str.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
}

/**
 * Safely creates a DOM element with text content
 * @param tagName - The HTML tag name
 * @param textContent - The text content (will be escaped)
 * @param className - Optional CSS class name
 * @returns The created DOM element
 */
export function createSafeElement(
  tagName: string,
  textContent?: string,
  className?: string
): HTMLElement {
  const element = document.createElement(tagName);
  if (textContent) {
    element.textContent = textContent; // Safe: automatically escapes
  }
  if (className) {
    element.className = className;
  }
  return element;
}

/**
 * Safely sets innerHTML using escaped content
 * @param element - The DOM element
 * @param htmlContent - The HTML content to escape and set
 */
export function setSafeInnerHTML(element: HTMLElement, htmlContent: string): void {
  element.innerHTML = escapeHtml(htmlContent);
}

/**
 * Validates and sanitizes URLs for sharing functions
 * @param url - The URL to validate
 * @returns The sanitized URL or null if invalid
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    // Only allow http and https protocols
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return null;
    }
    return parsedUrl.toString();
  } catch {
    return null;
  }
}

/**
 * Creates a safe modal element without innerHTML injection
 * @param content - Object containing safe content structure
 * @returns The created modal element
 */
export function createSafeModal(content: {
  title: string;
  description: string;
  className?: string;
}): HTMLElement {
  const modal = document.createElement('div');
  modal.className = content.className || 'fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4';

  const container = document.createElement('div');
  container.className = 'bg-card rounded-2xl w-full max-w-md border border-border/40 overflow-hidden shadow-2xl';

  const header = document.createElement('div');
  header.className = 'bg-gradient-to-r from-primary to-accent p-6 text-center text-white';

  const icon = document.createElement('div');
  icon.className = 'text-4xl mb-2';
  icon.textContent = '📤';

  const title = document.createElement('h3');
  title.className = 'text-xl font-bold';
  title.textContent = content.title;

  const description = document.createElement('p');
  description.className = 'text-sm opacity-90 mt-1';
  description.textContent = content.description;

  header.appendChild(icon);
  header.appendChild(title);
  header.appendChild(description);
  container.appendChild(header);
  modal.appendChild(container);

  return modal;
}

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - Raw user input
 * @returns Sanitized string safe for display
 */
export function sanitizeContent(input: string): string {
  if (!input) return '';

  return input
    .trim()
    // Remove potential script tags and javascript: URLs
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    // Remove HTML tags but preserve line breaks
    .replace(/<[^>]*>/g, '')
    // Remove any remaining suspicious patterns
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .replace(/expression\s*\(/gi, '') // Remove CSS expressions
    .trim();
}

/**
 * Validate content for malicious patterns
 * @param content - Content to validate
 * @returns true if content is safe, false otherwise
 */
export function validateContent(content: string): boolean {
  if (!content || typeof content !== 'string') return false;

  const cleaned = content.trim();

  // Length validation
  if (cleaned.length < 20 || cleaned.length > 2000) return false;

  // Check for malicious patterns
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /on\w+\s*=/i, // Event handlers
    /expression\s*\(/i, // CSS expressions
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<meta/i,
    /<style/i,
  ];

  for (const pattern of maliciousPatterns) {
    if (pattern.test(cleaned)) {
      return false;
    }
  }

  return true;
}

/**
 * Rate limiting storage (in-memory for now)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit for a given key
 * @param key - Unique identifier (IP + action)
 * @param limit - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if within limit, false if exceeded
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false; // Rate limit exceeded
  }

  entry.count++;
  return true;
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get client IP address from request headers
 */
export function getClientIP(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const clientIp = headers.get('x-client-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  if (clientIp) {
    return clientIp;
  }

  return 'unknown';
}