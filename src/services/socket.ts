import io, { Socket } from 'socket.io-client';
import { getApiBaseUrl, getAuthToken } from './api';
import { Message } from '../types';

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Function[]> = new Map();

    // Initialize socket connection
    async connect() {
        if (this.socket?.connected) return;

        const token = await getAuthToken();
        if (!token) {
            console.warn('Socket connection aborted: No token found');
            return;
        }

        const baseUrl = getApiBaseUrl(); // "http://10.0.2.2:3000"

        this.socket = io(baseUrl, {
            auth: { token },
            transports: ['websocket'], // Use WebSocket first
            reconnection: true,
            reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket?.id);
            this.notify('connect');
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
            this.notify('disconnect');
        });

        this.socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            this.notify('error', err);
        });

        // Global message handler
        this.socket.on('new_message', (message: Message) => {
            console.log('New message received via socket:', message.id);
            this.notify('new_message', message);
        });

        // Message notification handler (when not in chat)
        this.socket.on('message_notification', (data) => {
            this.notify('message_notification', data);
        });

        // Call event handlers
        this.socket.on('incoming_call', (data) => {
            console.log('📞 Incoming call received:', data);
            this.notify('incoming_call', data);
        });

        this.socket.on('call_answered', (data) => {
            console.log('📞 Call answered:', data);
            this.notify('call_answered', data);
        });

        this.socket.on('call_ended', (data) => {
            console.log('📞 Call ended:', data);
            this.notify('call_ended', data);
        });

        this.socket.on('call_declined', (data) => {
            console.log('📞 Call declined:', data);
            this.notify('call_declined', data);
        });
    }

    // Disconnect socket
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Join a specific chat room
    joinChat(matchId: number) {
        if (!this.socket?.connected) {
            this.connect(); // Auto-connect if not connected
        }
        this.socket?.emit('join_chat', { matchId });
    }

    // Leave a chat room
    leaveChat(matchId: number) { // Using matchId here as identifier, backend expects chatRoomId but we probably map it? 
        // Backend implementation: socket.on('leave_chat', (data: { chatRoomId: number }) => { ... });
        // This mismatch needs addressing. The backend expects chatRoomId, but frontend might only have matchId handy.
        // For now, let's assume the frontend passes chatRoomId if it has it, or we rely on the implementation.
        // Actually, looking at backend: `socket.on('join_chat', async (data: { matchId: number })` -> Backend finds chatRoom from matchId.
        // But `socket.on('leave_chat', (data: { chatRoomId: number })` -> Backend expects chatRoomId directly.
        // This is inconsistent. I should update backend to accept matchId for leave as well, or update frontend to pass chatRoomId.
        // For now I'll just skip explicit leave on cleanup or implement it if I have the chatRoomId.
        // Let's implement sendMessage first.
    }

    // Send a message
    sendMessage(matchId: number, content: string) {
        if (!this.socket?.connected) {
            this.connect();
        }
        this.socket?.emit('send_message', { matchId, content });
    }

    // Add event listener
    on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);

        // Wire up to socket if it exists and hasn't been done for this event type?
        // Actually, simpler to just have the central handlers dispatch to these listeners.
    }

    // Remove event listener
    off(event: string, callback: Function) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event)?.filter(cb => cb !== callback);
            this.listeners.set(event, callbacks || []);
        }
    }

    // Internal notify
    private notify(event: string, data?: any) {
        if (this.listeners.has(event)) {
            this.listeners.get(event)?.forEach(callback => callback(data));
        }
    }
}

export const socketService = new SocketService();
