import { extractEmailThread } from '../utils/gmail';
import { getStorageData } from '../utils/storage';
import { searchContactByEmail } from '../api/hubspot';
import { generateEmailResponse } from '../api/openai';
import { EmailContext } from '../types';
import './content.css';

/**
 * Main content script entry point
 */
function initContentScript() {
  console.log('HubSpot Gmail Breeze AI: Content script loaded');

  // Observe DOM for Gmail email action buttons (Reply/Forward)
  observeGmailActions();
}

/**
 * Observe Gmail for email action buttons (Reply/Forward area)
 */
function observeGmailActions() {
  const observer = new MutationObserver(() => {
    // Look for email messages that don't have our button yet
    findAndInjectButtons();
  });

  // Observe the Gmail main container
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial check
  setTimeout(() => {
    findAndInjectButtons();
  }, 1000);
}

/**
 * Find Gmail email action areas and inject Breeze button
 */
function findAndInjectButtons() {
  // Look for Gmail's action button containers
  // These contain Reply, Reply All, Forward buttons
  const actionContainers = document.querySelectorAll('[role="button"][data-tooltip*="Reply"]');

  actionContainers.forEach((replyButton) => {
    const parent = replyButton.parentElement;
    if (!parent || parent.querySelector('.breeze-ai-button')) {
      return; // Already injected or no parent
    }

    // Create our button
    injectBreezeButtonInActions(parent, replyButton as HTMLElement);
  });
}

/**
 * Inject Breeze button into Gmail's action button area
 */
function injectBreezeButtonInActions(container: HTMLElement, replyButton: HTMLElement) {
  // Create button element styled like Gmail's buttons
  const breezeBtn = document.createElement('div');
  breezeBtn.className = 'breeze-ai-button';
  breezeBtn.setAttribute('role', 'button');
  breezeBtn.setAttribute('aria-label', 'Reply with Breeze AI');
  breezeBtn.title = 'Reply with Breeze AI';

  // Add icon and text
  breezeBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="margin-right: 4px;">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span>Reply with Breeze</span>
  `;

  // Add click handler
  breezeBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await handleBreezeReply(replyButton);
  });

  // Insert after the reply button
  if (replyButton.nextSibling) {
    container.insertBefore(breezeBtn, replyButton.nextSibling);
  } else {
    container.appendChild(breezeBtn);
  }
}

/**
 * Handle Breeze reply button click
 */
async function handleBreezeReply(replyButton: HTMLElement): Promise<void> {
  try {
    // Step 1: Click the Gmail Reply button to open compose box
    replyButton.click();

    // Wait for compose box to appear
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 2: Find the compose box
    const composeBox = findComposeBox();
    if (!composeBox) {
      alert('Could not find reply box. Please try again.');
      return;
    }

    // Step 3: Show loading message
    showLoadingMessage(composeBox);

    // Step 4: Get API keys
    const { hubspotToken, openaiKey } = await getStorageData();

    if (!openaiKey) {
      composeBox.textContent = '';
      alert('Please configure your OpenAI API key in the extension settings.');
      chrome.runtime.openOptionsPage();
      return;
    }

    // Step 5: Extract email thread
    const thread = extractEmailThread();
    if (!thread) {
      composeBox.textContent = '';
      alert('Could not extract email thread. Please try again.');
      return;
    }

    console.log('Extracted thread:', thread);

    // Step 6: Fetch HubSpot contact
    let contact = null;
    if (hubspotToken && thread.senderEmail) {
      console.log('Fetching HubSpot contact for:', thread.senderEmail);
      contact = await searchContactByEmail(thread.senderEmail, hubspotToken);
      if (contact) {
        console.log('Found contact:', contact);
      }
    }

    // Step 7: Generate AI response
    const context: EmailContext = {
      thread,
      contact: contact || undefined,
    };

    console.log('Generating response with context...');
    const response = await generateEmailResponse(context, openaiKey);

    if (!response) {
      composeBox.textContent = '';
      alert('Failed to generate response. Please check your API keys and try again.');
      return;
    }

    // Step 8: Insert response into compose box
    composeBox.textContent = response;

    // Trigger input event to notify Gmail
    const event = new Event('input', { bubbles: true });
    composeBox.dispatchEvent(event);

    console.log('Response inserted successfully');
  } catch (error) {
    console.error('Error in handleBreezeReply:', error);
    alert('An error occurred. Please try again.');
  }
}

/**
 * Find the compose box
 */
function findComposeBox(): HTMLElement | null {
  const selectors = [
    '[role="textbox"][aria-label*="Message"]',
    '[aria-label="Message Body"]',
    'div[contenteditable="true"][aria-label*="reply"]',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element && element.isContentEditable) {
      return element;
    }
  }

  return null;
}

/**
 * Show loading message in compose box
 */
function showLoadingMessage(composeBox: HTMLElement) {
  composeBox.innerHTML = `
    <div style="display: flex; align-items: center; color: #5f6368; font-style: italic;">
      <div style="
        width: 16px;
        height: 16px;
        border: 2px solid #ff7a59;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-right: 8px;
      "></div>
      <span>Generating response with Breeze AI...</span>
    </div>
  `;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentScript);
} else {
  initContentScript();
}
