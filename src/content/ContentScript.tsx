import React from 'react';
import ReactDOM from 'react-dom/client';
import BreezeButton from './BreezeButton';
import { extractEmailThread, insertTextIntoComposeBox } from '../utils/gmail';
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

  // Observe DOM for Gmail compose boxes
  observeGmailCompose();
}

/**
 * Observe Gmail for new compose/reply boxes
 */
function observeGmailCompose() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          // Check if this is a reply/compose area
          const composeBox = node.querySelector('[role="textbox"][aria-label*="Message"]');
          if (composeBox) {
            injectBreezeButton(composeBox as HTMLElement);
          }
        }
      });
    });
  });

  // Observe the Gmail main container
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also check for existing compose boxes on load
  setTimeout(() => {
    const existingComposeBoxes = document.querySelectorAll(
      '[role="textbox"][aria-label*="Message"]'
    );
    existingComposeBoxes.forEach((box) => {
      injectBreezeButton(box as HTMLElement);
    });
  }, 2000);
}

/**
 * Inject Breeze button near the compose box
 */
function injectBreezeButton(composeBox: HTMLElement) {
  // Check if button already exists
  const existingButton = composeBox.parentElement?.querySelector('.breeze-button-container');
  if (existingButton) {
    return;
  }

  // Find the toolbar area (usually the parent or sibling of compose box)
  let toolbar = composeBox.parentElement?.querySelector('[role="toolbar"]');

  // If no toolbar found, try to find the compose actions area
  if (!toolbar) {
    const composeArea = composeBox.closest('[role="region"]');
    toolbar = composeArea?.querySelector('[role="toolbar"]');
  }

  // Create container for React component
  const buttonContainer = document.createElement('div');
  buttonContainer.id = `breeze-button-${Date.now()}`;
  buttonContainer.style.display = 'inline-block';
  buttonContainer.style.marginLeft = '8px';

  // Insert button container
  if (toolbar) {
    toolbar.appendChild(buttonContainer);
  } else {
    // Fallback: insert before compose box
    composeBox.parentElement?.insertBefore(buttonContainer, composeBox);
  }

  // Render React button
  const root = ReactDOM.createRoot(buttonContainer);
  root.render(
    <React.StrictMode>
      <BreezeButton onGenerate={handleGenerateResponse} />
    </React.StrictMode>
  );
}

/**
 * Handle the "Generate Response" button click
 */
async function handleGenerateResponse(): Promise<void> {
  console.log('Generating AI response...');

  // Step 1: Get API keys from storage
  const { hubspotToken, openaiKey } = await getStorageData();

  if (!openaiKey) {
    alert('Please configure your OpenAI API key in the extension settings.');
    chrome.runtime.openOptionsPage();
    return;
  }

  // Step 2: Extract email thread from Gmail
  const thread = extractEmailThread();

  if (!thread) {
    alert('Could not extract email thread. Please try again.');
    return;
  }

  console.log('Extracted thread:', thread);

  // Step 3: Fetch HubSpot contact (if token available)
  let contact = null;
  if (hubspotToken && thread.senderEmail) {
    console.log('Fetching HubSpot contact for:', thread.senderEmail);
    contact = await searchContactByEmail(thread.senderEmail, hubspotToken);
    if (contact) {
      console.log('Found contact:', contact);
    } else {
      console.log('No contact found in HubSpot');
    }
  }

  // Step 4: Build context and generate response
  const context: EmailContext = {
    thread,
    contact: contact || undefined,
  };

  console.log('Generating response with context...');
  const response = await generateEmailResponse(context, openaiKey);

  if (!response) {
    alert('Failed to generate response. Please check your API keys and try again.');
    return;
  }

  // Step 5: Insert response into compose box
  const success = insertTextIntoComposeBox(response);

  if (success) {
    console.log('Response inserted successfully');
  } else {
    alert('Could not insert response into compose box. Please try copying it manually.');
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentScript);
} else {
  initContentScript();
}
