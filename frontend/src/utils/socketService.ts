import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config';

// Allow overriding the socket URL via an env var (useful for prod vs dev)
const SOCKET_URL = (import.meta as any).env?.VITE_SOCKET_URL ?? `${API_BASE_URL}`;

class SocketService {
    private socket: Socket | null = null;
    private userId: string | null = null;

    /** Connect (or reconnect) the socket for a given user */
    connect(userId: string) {
        // If already connected for the same user, do nothing
        if (this.socket?.connected && this.userId === userId) return;

        this.userId = userId;

        // Initialise socket only once
        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 30000, // Increased from 20s
                autoConnect: false,
                // Enable verbose logging in development
                ...((import.meta as any).env?.MODE === 'development' && { logger: console })
            });

            // ----- Event listeners -----
            this.socket.on('connect', () => {
                console.log('🔌 Connected to socket server');
                if (this.userId) this.socket?.emit('user_online', this.userId);
            });

            this.socket.on('reconnect', (attempt) => {
                console.log(`🔌 Reconnected after ${attempt} attempts`);
                if (this.userId) this.socket?.emit('user_online', this.userId);
            });

            this.socket.on('disconnect', (reason) => {
                console.warn('🔌 Disconnected:', reason);
                // If server intentionally closed the connection, try to reconnect after a pause
                if (reason === 'io server disconnect') {
                    setTimeout(() => this.socket?.connect(), 2000);
                }
            });

            this.socket.on('connect_error', (error) => {
                console.error('🔌 Socket connection error:', error);
                // If websocket transport fails, fall back to polling
                if ((error as any).type === 'TransportError' && error.message.includes('websocket')) {
                    console.warn('🔧 Falling back to polling transport');
                    if (this.socket) {
                        this.socket.io.opts.transports = ['polling'];
                        this.socket.connect();
                    }
                }
            });
        }

        // Ensure the socket is (re)connected if it was previously disconnected
        if (this.socket.disconnected) {
            this.socket.connect();
        } else if (this.socket.connected) {
            // User switched accounts – re‑emit the new user id
            this.socket.emit('user_online', this.userId);
        }
    }

    /** Return the underlying socket instance */
    getSocket() {
        return this.socket;
    }

    /** Emit a custom event */
    emit(event: string, data: any) {
        this.socket?.emit(event, data);
    }

    /** Gracefully disconnect */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.userId = null;
        }
    }
}

export const socketService = new SocketService();
