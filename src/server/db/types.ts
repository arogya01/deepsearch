import { type UIMessage } from 'ai';

// ============================================================================
// Chat Session Types
// ============================================================================

export interface CreateSessionParams {
  userId: number;
  title?: string;
  chatId?: string;
}

export interface UpdateSessionMetadata {
  title?: string;
  messageCount?: number;
  lastMessageAt?: Date;
  isActive?: boolean;
  activeStreamId?: string | null;
}

// ============================================================================
// Message Types
//============================================================================

export interface SaveMessageParams {
  id: string;
  sessionId: string;
  sequence: number;
  role: 'user' | 'assistant' | 'system' | 'tool';
  status: 'pending' | 'streaming' | 'completed' | 'errored';
  content?: unknown;
  metadata?: {
    finishReason?: string;
    model?: string;
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
    [key: string]: unknown;
  };
  startedAt?: Date;
  completedAt?: Date;
}

// ============================================================================
// Message Part Types
// ============================================================================

export interface MessagePart {
  type: string;
  partIndex: number;
  payload: unknown;
  isFinal: boolean;
}

export interface TextPart {
  type: 'text';
  partIndex: number;
  payload: {
    text: string;
  };
  isFinal: boolean;
}

export interface ToolCallPart {
  type: 'tool-call';
  partIndex: number;
  payload: {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
  };
  isFinal: boolean;
}

export interface ToolResultPart {
  type: 'tool-result';
  partIndex: number;
  payload: {
    toolCallId: string;
    toolName: string;
    result: unknown;
  };
  isFinal: boolean;
}

// ============================================================================
// Session with Messages
// ============================================================================

export interface SessionWithMessages {
  sessionId: string;
  userId: number;
  title: string;
  isActive: boolean;
  messageCount: number;
  lastMessageAt: Date | null;
  createdAt: Date;
  messages: UIMessage[];
}

