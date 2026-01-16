// Storage types
export interface StorageData {
  hubspotToken?: string;
  openaiKey?: string;
}

// HubSpot API types
export interface HubSpotContact {
  id: string;
  properties: {
    email: string;
    firstname?: string;
    lastname?: string;
    company?: string;
    jobtitle?: string;
    phone?: string;
    hs_object_id?: string;
  };
  associations?: {
    deals?: Array<{
      id: string;
      properties?: Record<string, string>;
    }>;
  };
}

export interface HubSpotSearchResponse {
  results: HubSpotContact[];
  total: number;
}

// OpenAI API types
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIChatCompletionRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number; // GPT-4 and older models
  max_completion_tokens?: number; // GPT-5 models
}

export interface OpenAIChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  choices: Array<{
    index: number;
    message: OpenAIMessage;
    finish_reason: string;
  }>;
}

// Gmail types
export interface EmailThread {
  subject: string;
  messages: EmailMessage[];
  senderEmail: string;
}

export interface EmailMessage {
  from: string;
  date: string;
  content: string;
}

// Context for AI
export interface EmailContext {
  thread: EmailThread;
  contact?: HubSpotContact;
}
