/**
 * Background Service Worker
 * Handles API calls to avoid CORS issues in content scripts
 */

import { searchContactByEmail } from '../api/hubspot';
import { generateEmailResponse } from '../api/openai';
import { getStorageData } from '../utils/storage';
import { EmailContext } from '../types';

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'GENERATE_RESPONSE') {
    handleGenerateResponse(request.data)
      .then(sendResponse)
      .catch((error) => {
        console.error('Error in background:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
});

/**
 * Handle response generation request
 */
async function handleGenerateResponse(data: { context: EmailContext }) {
  try {
    // Get API keys from storage
    const { hubspotToken, openaiKey } = await getStorageData();

    if (!openaiKey) {
      return {
        success: false,
        error: 'OpenAI API key not configured',
      };
    }

    // Fetch HubSpot contact if we have a token and email
    let contact = data.context.contact;
    if (hubspotToken && data.context.thread.senderEmail && !contact) {
      console.log('Fetching HubSpot contact for:', data.context.thread.senderEmail);
      const foundContact = await searchContactByEmail(data.context.thread.senderEmail, hubspotToken);
      if (foundContact) {
        console.log('Found contact:', foundContact);
        contact = foundContact;
      } else {
        console.log('No contact found in HubSpot');
      }
    }

    // Update context with contact
    const fullContext: EmailContext = {
      ...data.context,
      contact: contact ?? undefined,
    };

    // Generate AI response
    console.log('Generating response with context...');
    const response = await generateEmailResponse(fullContext, openaiKey);

    if (!response) {
      return {
        success: false,
        error: 'Failed to generate response',
      };
    }

    return {
      success: true,
      response,
      contact,
    };
  } catch (error) {
    console.error('Error generating response:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

console.log('HubSpot Gmail Breeze AI: Background service worker loaded');
