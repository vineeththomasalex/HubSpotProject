import { EmailThread, EmailMessage } from '../types';

/**
 * Extract sender email from Gmail thread
 */
export function extractSenderEmail(): string | null {
  // Try to find the sender email from the first message in the thread
  const emailElements = document.querySelectorAll('[email]');
  if (emailElements.length > 0) {
    const email = emailElements[0].getAttribute('email');
    if (email) return email;
  }

  // Fallback: try to parse from visible email addresses
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
  const bodyText = document.body.innerText;
  const match = bodyText.match(emailRegex);

  return match ? match[1] : null;
}

/**
 * Extract email thread content from Gmail
 */
export function extractEmailThread(): EmailThread | null {
  try {
    // Get subject line
    const subjectElement = document.querySelector('h2.hP');
    const subject = subjectElement?.textContent?.trim() || 'No subject';

    // Get all messages in the thread
    const messageElements = document.querySelectorAll('.gs');
    const messages: EmailMessage[] = [];

    messageElements.forEach((msgEl) => {
      // Extract sender
      const senderEl = msgEl.querySelector('.gD');
      const from = senderEl?.getAttribute('email') || senderEl?.textContent || 'Unknown';

      // Extract date
      const dateEl = msgEl.querySelector('.g3');
      const date = dateEl?.getAttribute('title') || dateEl?.textContent || '';

      // Extract message content
      const contentEl = msgEl.querySelector('.a3s.aiL');
      const content = contentEl?.textContent?.trim() || '';

      if (content) {
        messages.push({ from, date, content });
      }
    });

    const senderEmail = extractSenderEmail();

    return {
      subject,
      messages,
      senderEmail: senderEmail || 'unknown@example.com',
    };
  } catch (error) {
    console.error('Error extracting email thread:', error);
    return null;
  }
}

/**
 * Find Gmail compose box
 */
export function findComposeBox(): HTMLElement | null {
  // Gmail compose box selectors
  const selectors = [
    '[role="textbox"][aria-label*="Message"]',
    '[aria-label="Message Body"]',
    'div[aria-label*="reply"]',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) return element;
  }

  return null;
}

/**
 * Insert text into Gmail compose box
 */
export function insertTextIntoComposeBox(text: string): boolean {
  const composeBox = findComposeBox();

  if (!composeBox) {
    console.error('Could not find compose box');
    return false;
  }

  try {
    // Set the text content
    composeBox.textContent = text;

    // Trigger input event to notify Gmail
    const event = new Event('input', { bubbles: true });
    composeBox.dispatchEvent(event);

    return true;
  } catch (error) {
    console.error('Error inserting text into compose box:', error);
    return false;
  }
}

/**
 * Find reply button container to inject our custom button
 */
export function findReplyButtonContainer(): HTMLElement | null {
  // Look for the reply button toolbar area
  const replyToolbar = document.querySelector('[role="toolbar"]');
  return replyToolbar as HTMLElement;
}
