import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '../types';

// Storage keys
const CHAT_PREFIX = '@chat_messages_';
const CHAT_SYNC_PREFIX = '@chat_sync_';
const MAX_LOCAL_MESSAGES = 100; // Keep last 100 messages locally per chat

interface ChatStorageData {
  messages: Message[];
  lastSyncTimestamp: string | null;
  oldestMessageId: number | null;
  newestMessageId: number | null;
}

/**
 * Local-first chat storage service
 * Stores messages in AsyncStorage to reduce API calls
 */
export const chatStorage = {
  /**
   * Get storage key for a chat
   */
  getStorageKey: (matchId: number): string => {
    return `${CHAT_PREFIX}${matchId}`;
  },

  getSyncKey: (matchId: number): string => {
    return `${CHAT_SYNC_PREFIX}${matchId}`;
  },

  /**
   * Get locally stored messages for a chat
   */
  getMessages: async (matchId: number): Promise<ChatStorageData | null> => {
    try {
      const key = chatStorage.getStorageKey(matchId);
      const data = await AsyncStorage.getItem(key);
      if (data) {
        return JSON.parse(data) as ChatStorageData;
      }
      return null;
    } catch (error) {
      console.error('Error reading chat from storage:', error);
      return null;
    }
  },

  /**
   * Save messages to local storage
   */
  saveMessages: async (
    matchId: number,
    messages: Message[],
    lastSyncTimestamp?: string
  ): Promise<void> => {
    try {
      const key = chatStorage.getStorageKey(matchId);
      
      // Keep only last N messages to limit storage size
      const trimmedMessages = messages.slice(-MAX_LOCAL_MESSAGES);
      
      const data: ChatStorageData = {
        messages: trimmedMessages,
        lastSyncTimestamp: lastSyncTimestamp || new Date().toISOString(),
        oldestMessageId: trimmedMessages.length > 0 ? trimmedMessages[0].id : null,
        newestMessageId: trimmedMessages.length > 0 ? trimmedMessages[trimmedMessages.length - 1].id : null,
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving chat to storage:', error);
    }
  },

  /**
   * Add a single message to local storage (for new messages)
   */
  addMessage: async (matchId: number, message: Message): Promise<void> => {
    try {
      const existing = await chatStorage.getMessages(matchId);
      const messages = existing?.messages || [];
      
      // Check if message already exists
      if (messages.some(m => m.id === message.id)) {
        return;
      }
      
      // Add new message and trim if needed
      messages.push(message);
      await chatStorage.saveMessages(matchId, messages);
    } catch (error) {
      console.error('Error adding message to storage:', error);
    }
  },

  /**
   * Prepend older messages (for pagination when scrolling up)
   */
  prependMessages: async (matchId: number, olderMessages: Message[]): Promise<void> => {
    try {
      const existing = await chatStorage.getMessages(matchId);
      const currentMessages = existing?.messages || [];
      
      // Filter out duplicates
      const newMessages = olderMessages.filter(
        msg => !currentMessages.some(m => m.id === msg.id)
      );
      
      // Prepend older messages
      const allMessages = [...newMessages, ...currentMessages];
      
      // Trim from the end if exceeds limit (keep older messages when loading history)
      const trimmedMessages = allMessages.slice(0, MAX_LOCAL_MESSAGES);
      
      await chatStorage.saveMessages(matchId, trimmedMessages, existing?.lastSyncTimestamp || undefined);
    } catch (error) {
      console.error('Error prepending messages to storage:', error);
    }
  },

  /**
   * Get last sync timestamp for a chat
   */
  getLastSyncTimestamp: async (matchId: number): Promise<string | null> => {
    try {
      const data = await chatStorage.getMessages(matchId);
      return data?.lastSyncTimestamp || null;
    } catch (error) {
      console.error('Error getting last sync timestamp:', error);
      return null;
    }
  },

  /**
   * Check if local data exists for a chat
   */
  hasLocalData: async (matchId: number): Promise<boolean> => {
    try {
      const data = await chatStorage.getMessages(matchId);
      return data !== null && data.messages.length > 0;
    } catch (error) {
      return false;
    }
  },

  /**
   * Clear local data for a chat (e.g., on unmatch)
   */
  clearChat: async (matchId: number): Promise<void> => {
    try {
      const key = chatStorage.getStorageKey(matchId);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing chat from storage:', error);
    }
  },

  /**
   * Clear all chat data (e.g., on logout)
   */
  clearAllChats: async (): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const chatKeys = keys.filter(k => k.startsWith(CHAT_PREFIX) || k.startsWith(CHAT_SYNC_PREFIX));
      await AsyncStorage.multiRemove(chatKeys);
    } catch (error) {
      console.error('Error clearing all chats from storage:', error);
    }
  },

  /**
   * Get oldest message ID for pagination
   */
  getOldestMessageId: async (matchId: number): Promise<number | null> => {
    try {
      const data = await chatStorage.getMessages(matchId);
      return data?.oldestMessageId || null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Get newest message ID for sync
   */
  getNewestMessageId: async (matchId: number): Promise<number | null> => {
    try {
      const data = await chatStorage.getMessages(matchId);
      return data?.newestMessageId || null;
    } catch (error) {
      return null;
    }
  },
};

export default chatStorage;

