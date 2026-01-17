import {
  OpenAIMessage,
  OpenAIChatCompletionRequest,
  OpenAIChatCompletionResponse,
  EmailContext,
  EmailResponseStructure,
  UserContext,
} from '../types';
import { formatContactForAI } from './hubspot';

const OPENAI_API_BASE = 'https://api.openai.com/v1';

// JSON Schema for structured output
const EMAIL_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    body: {
      type: 'string',
      description: 'The email body content without subject line. Should include greeting, message content, and signature with proper line breaks.',
    },
  },
  required: ['body'],
  additionalProperties: false,
};

/**
 * Format user context for AI prompt
 */
function formatUserContextForAI(userContext: UserContext): string {
  let context = 'Your Profile (Person Responding):\n';

  if (userContext.userName) context += `Name: ${userContext.userName}\n`;
  if (userContext.jobTitle) context += `Role: ${userContext.jobTitle}\n`;
  if (userContext.companyName) context += `Company: ${userContext.companyName}\n`;
  if (userContext.department) context += `Department: ${userContext.department}\n`;
  if (userContext.communicationStyle) {
    context += `Communication Style: ${userContext.communicationStyle}\n`;
  }

  if (userContext.customInstructions) {
    context += `\nAbout You:\n${userContext.customInstructions}\n`;
  }

  return context;
}

/**
 * Generate email response using OpenAI
 */
export async function generateEmailResponse(
  context: EmailContext,
  apiKey: string
): Promise<string | null> {
  console.log('[OpenAI] generateEmailResponse called');

  try {
    const messages = buildPrompt(context);
    console.log('[OpenAI] Built prompt with', messages.length, 'messages');

    const requestBody: OpenAIChatCompletionRequest = {
      model: 'gpt-5-nano',
      messages,
      // temperature: 0.7, // GPT-5 Nano only supports default temperature of 1
      max_completion_tokens: 10000, // Increased to allow for reasoning tokens + output
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'email_response',
          strict: true,
          schema: EMAIL_RESPONSE_SCHEMA,
        },
      },
    };

    console.log('[OpenAI] Sending request to OpenAI API...');
    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[OpenAI] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[OpenAI] API error response:', errorData);
      return null;
    }

    const data: OpenAIChatCompletionResponse = await response.json();
    console.log('[OpenAI] Response data received:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length
    });

    if (data.choices && data.choices.length > 0) {
      console.log('[OpenAI] First choice:', JSON.stringify(data.choices[0], null, 2));
      const content = data.choices[0].message.content;
      console.log('[OpenAI] Message content:', content);

      if (!content) {
        console.log('[OpenAI] Content is null or empty');
        return null;
      }

      // Parse structured JSON response - guaranteed valid by OpenAI
      const jsonResponse: EmailResponseStructure = JSON.parse(content);
      console.log('[OpenAI] Parsed structured response body:', `${jsonResponse.body.length} chars`);
      return jsonResponse.body;
    }

    console.log('[OpenAI] No choices in response');
    return null;
  } catch (error) {
    console.error('[OpenAI] Exception:', error);
    return null;
  }
}

/**
 * Build prompt for OpenAI with context
 */
function buildPrompt(context: EmailContext): OpenAIMessage[] {
  const { thread, contact, userContext } = context;

  // Build system message with user context if available
  let systemContent = 'You are a professional email assistant integrated with HubSpot CRM.';

  if (userContext && (userContext.userName || userContext.jobTitle)) {
    systemContent += ` You are helping ${userContext.userName || 'the user'}`;
    if (userContext.jobTitle) {
      systemContent += ` (${userContext.jobTitle})`;
    }
    if (userContext.companyName) {
      systemContent += ` at ${userContext.companyName}`;
    }
    systemContent += ' respond to emails.';
  }

  systemContent += ' Your task is to generate professional, contextually appropriate email responses. Use the contact information from HubSpot and the email thread context to craft personalized replies.';

  if (userContext?.communicationStyle) {
    systemContent += ` The user prefers a ${userContext.communicationStyle.toLowerCase()} communication style.`;
  }

  systemContent += ' Write responses that are concise, enthusiastic, and sound naturally human - avoid corporate jargon and overly formal language. Be warm, genuine, and conversational while remaining professional. Keep responses brief and to the point. Show authentic enthusiasm when appropriate.';
  systemContent += '\n\nDo not include the subject line in your response. Only provide the email body with greeting, message content, and signature. Use \\n characters for line breaks.';

  const systemMessage: OpenAIMessage = {
    role: 'system',
    content: systemContent,
  };

  // Build user message with all context
  let userContent = `Generate a professional email response based on the following context:\n\n`;

  // Add contact information
  if (contact) {
    userContent += `${formatContactForAI(contact)}\n\n`;
  } else {
    userContent += `Note: No HubSpot contact information available for this sender.\n\n`;
  }

  // Add user context
  if (userContext && (userContext.userName || userContext.jobTitle || userContext.customInstructions)) {
    userContent += `${formatUserContextForAI(userContext)}\n\n`;
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

  userContent += `\n\nPlease generate a concise, enthusiastic, and naturally human email response to the most recent message. Keep it brief, warm, and conversational.`;

  // Add custom signature instruction if enabled
  if (userContext?.useCustomSignature && userContext.customSignature) {
    userContent += `\n\nIMPORTANT: Include the following signature at the end of your response:\n${userContext.customSignature}`;
  }

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
      max_completion_tokens: 5,
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
