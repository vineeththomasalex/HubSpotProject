// Storage types
export interface StorageData {
  hubspotToken?: string;
  openaiKey?: string;
  // User context fields
  userName?: string;
  jobTitle?: string;
  companyName?: string;
  department?: string;
  communicationStyle?: string;
  customInstructions?: string;
  useCustomSignature?: boolean;
  customSignature?: string;
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
  response_format?: {
    type: 'json_schema';
    json_schema: {
      name: string;
      strict?: boolean;
      schema: Record<string, any>;
    };
  };
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

// User context
export interface UserContext {
  userName?: string;
  jobTitle?: string;
  companyName?: string;
  department?: string;
  communicationStyle?: string;
  customInstructions?: string;
  useCustomSignature?: boolean;
  customSignature?: string;
}

// Context for AI
export interface EmailContext {
  thread: EmailThread;
  contact?: HubSpotContact;
  userContext?: UserContext;
}

// Structured OpenAI response
export interface EmailResponseStructure {
  body: string;
}
