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