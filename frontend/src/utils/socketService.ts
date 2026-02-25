import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config';

const SOCKET_URL = `${API_BASE_URL}`;

class SocketService {
    private socket: Socket | null = null;
    private userId: string | null = null;

    connect(userId: string) {
        if (this.socket?.connected && this.userId === userId) return;

        this.userId = userId;

        if (!this.socket) {
            this.socket = io(SOCKET_URL, {
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            this.socket.on('connect', () => {
                console.log('🔌 Connected to socket server');
                if (this.userId) {
                    this.socket?.emit('user_online', this.userId);
                }
            });

            this.socket.on('reconnect', () => {
                console.log('🔌 Reconnected to socket server');
                if (this.userId) {
                    this.socket?.emit('user_online', this.userId);
                }
            });

            this.socket.on('disconnect', (reason) => {
                console.log('🔌 Disconnected from socket server:', reason);
            });

            this.socket.on('connect_error', (error) => {
                console.error('🔌 Socket connection error:', error);
            });
        } else {
            if (this.socket.disconnected) {
                this.socket.connect();
            } else if (this.socket.connected) {
                // If already connected but userId changed (e.g. login as different user),
                // we MUST re-emit user_online to update backend mapping
                this.socket.emit('user_online', this.userId);
            }
        }
    }

    getSocket() {
        return this.socket;
    }

    emit(event: string, data: any) {
        this.socket?.emit(event, data);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.userId = null;
        }
    }
}

export const socketService = new SocketService();
