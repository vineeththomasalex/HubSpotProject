import {
  OpenAIMessage,
  OpenAIChatCompletionRequest,
  OpenAIChatCompletionResponse,
  EmailContext,
} from '../types';
import { formatContactForAI } from './hubspot';

const OPENAI_API_BASE = 'https://api.openai.com/v1';

/**
 * Generate email response using OpenAI
 */
export async function generateEmailResponse(
  context: EmailContext,
  apiKey: string
): Promise<string | null> {
  try {
    const messages = buildPrompt(context);

    const requestBody: OpenAIChatCompletionRequest = {
      model: 'gpt-5-nano',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    };

    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return null;
    }

    const data: OpenAIChatCompletionResponse = await response.json();

    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    }

    return null;
  } catch (error) {
    console.error('Error generating email response:', error);
    return null;
  }
}

/**
 * Build prompt for OpenAI with context
 */
function buildPrompt(context: EmailContext): OpenAIMessage[] {
  const { thread, contact } = context;

  // System message
  const systemMessage: OpenAIMessage = {
    role: 'system',
    content: `You are a professional email assistant integrated with HubSpot CRM. Your task is to generate professional, contextually appropriate email responses. Use the contact information from HubSpot and the email thread context to craft personalized replies. Be concise, professional, and helpful. If you don't have enough context, write a polite and general response.`,
  };

  // Build user message with all context
  let userContent = `Generate a professional email response based on the following context:\n\n`;

  // Add contact information
  if (contact) {
    userContent += `${formatContactForAI(contact)}\n\n`;
  } else {
    userContent += `Note: No HubSpot contact information available for this sender.\n\n`;
  }

  // Add email thread
  userContent += `Email Subject: ${thread.subject}\n\n`;
  userContent += `Email Thread (most recent first):\n`;

  thread.messages.forEach((msg, idx) => {
    userContent += `\n--- Message ${idx + 1} ---\n`;
    userContent += `From: ${msg.from}\n`;
    userContent += `Date: ${msg.date}\n`;
    userContent += `Content:\n${msg.content}\n`;
  });

  userContent += `\n\nPlease generate a professional email response to the most recent message in this thread. The response should be ready to send as-is.`;

  const userMessage: OpenAIMessage = {
    role: 'user',
    content: userContent,
  };

  return [systemMessage, userMessage];
}

/**
 * Test OpenAI API connection
 */
export async function testOpenAIConnection(apiKey: string): Promise<boolean> {
  try {
    const testRequest: OpenAIChatCompletionRequest = {
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'user',
          content: 'Test',
        },
      ],
      max_tokens: 5,
    };

    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(testRequest),
    });

    return response.ok;
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return false;
  }
}
