/**
 * Background Service Worker
 * Handles API calls to avoid CORS issues in content scripts
 */

import { searchContactByEmail } from '../api/hubspot';
import { generateEmailResponse } from '../api/openai';
import { getStorageData } from '../utils/storage';
import { EmailContext, UserContext } from '../types';

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('[Background] Received message:', request.type);

  if (request.type === 'GENERATE_RESPONSE') {
    console.log('[Background] Handling GENERATE_RESPONSE request');
    handleGenerateResponse(request.data)
      .then((result) => {
        console.log('[Background] Sending response back to content script:', result);
        sendResponse(result);
      })
      .catch((error) => {
        console.error('[Background] Error in handleGenerateResponse:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }

  console.log('[Background] Unknown message type:', request.type);
  return false;
});

/**
 * Handle response generation request
 */
async function handleGenerateResponse(data: { context: EmailContext }) {
  console.log('[Background] handleGenerateResponse called with:', data);

  try {
    // Get API keys and user context from storage
    console.log('[Background] Getting storage data...');
    const storageData = await getStorageData();
    const { hubspotToken, openaiKey } = storageData;
    console.log('[Background] Storage data retrieved:', {
      hasHubSpot: !!hubspotToken,
      hasOpenAI: !!openaiKey,
      hasUserContext: !!(storageData.userName || storageData.jobTitle || storageData.customInstructions),
    });

    if (!openaiKey) {
      console.log('[Background] Missing OpenAI API key');
      return {
        success: false,
        error: 'OpenAI API key not configured',
      };
    }

    // Build user context from storage data
    const userContext: UserContext = {
      userName: storageData.userName,
      jobTitle: storageData.jobTitle,
      companyName: storageData.companyName,
      department: storageData.department,
      communicationStyle: storageData.communicationStyle,
      customInstructions: storageData.customInstructions,
      useCustomSignature: storageData.useCustomSignature,
      customSignature: storageData.customSignature,
    };

    // Fetch HubSpot contact if we have a token and email
    let contact = data.context.contact;
    if (hubspotToken && data.context.thread.senderEmail && !contact) {
      console.log('[Background] Fetching HubSpot contact for:', data.context.thread.senderEmail);
      const foundContact = await searchContactByEmail(data.context.thread.senderEmail, hubspotToken);
      if (foundContact) {
        console.log('[Background] Found contact:', foundContact);
        contact = foundContact;
      } else {
        console.log('[Background] No contact found in HubSpot');
      }
    } else {
      console.log('[Background] Skipping HubSpot lookup:', {
        hasToken: !!hubspotToken,
        hasEmail: !!data.context.thread.senderEmail,
        hasContact: !!contact
      });
    }

    // Update context with contact and user context
    const fullContext: EmailContext = {
      ...data.context,
      contact: contact ?? undefined,
      userContext: userContext,
    };

    // Generate AI response
    console.log('[Background] Generating AI response with OpenAI...');
    const response = await generateEmailResponse(fullContext, openaiKey);
    console.log('[Background] OpenAI response received:', response ? `${response.length} characters` : 'null');

    if (!response) {
      console.log('[Background] No response from OpenAI');
      return {
        success: false,
        error: 'Failed to generate response from OpenAI',
      };
    }

    console.log('[Background] Success! Returning response');
    return {
      success: true,
      response,
      contact,
    };
  } catch (error) {
    console.error('[Background] Exception in handleGenerateResponse:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

console.log('HubSpot Gmail Breeze AI: Background service worker loaded');
