/**
 * Legacy file - Most session operations have been moved to chat-persistence.ts
 * This file is kept for backward compatibility and may contain utility functions
 */

// Re-export common session operations from chat-persistence
export {
  createOrGetSession,
  updateSessionMetadata,
  getUserSessions,
  getSessionWithMessages,
} from './chat-persistence';
