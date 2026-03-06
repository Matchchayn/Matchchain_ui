import { API_BASE_URL } from '../config';
import { safeLocalStorageSet } from './storageUtils';

/**
 * Service to pre-fetch critical data in the background.
 * This ensures that when the user clicks 'Messages' or 'Matches', 
 * the data is already populated in localStorage and shows up instantly.
 */
export const prefetchAppData = async (userId: string, token: string) => {
    if (!userId || !token) return;

    try {
        console.log('[Prefetch] Background sync started...');

        const headers = { 'Authorization': `Bearer ${token}` };

        // 1. Fetch Conversations
        const convosPromise = fetch(`${API_BASE_URL}/api/conversations`, { headers })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) {
                    const formatted = data.map((item: any) => ({
                        id: item._id,
                        other_user: {
                            id: item.otherUser?._id,
                            first_name: item.otherUser?.firstName,
                            last_name: item.otherUser?.lastName,
                            avatar_url: item.otherUser?.avatarUrl,
                            is_online: item.otherUser?.isOnline || false
                        },
                        last_message: item.lastMessage ? {
                            content: item.lastMessage.content,
                            created_at: item.lastMessage.createdAt,
                            is_read: item.lastMessage.isRead,
                            message_type: item.lastMessage.messageType
                        } : null,
                        unread_count: item.unreadCount || 0
                    }));

                    safeLocalStorageSet(`convos_${userId}`, formatted);

                    // Also prefetch the actual messages for the top 3 conversations
                    if (Array.isArray(data)) {
                        const topConvos = data.slice(0, 3);
                        topConvos.forEach(async (item: any) => {
                            const otherId = item.otherUser?._id;
                            if (!otherId) return;
                            try {
                                const msgRes = await fetch(`${API_BASE_URL}/api/messages/${otherId}`, { headers });
                                if (msgRes.ok) {
                                    const msgData = await msgRes.json();
                                    if (Array.isArray(msgData)) {
                                        // Limit to last 30 messages for prefetch to save space
                                        const formattedMsgs = msgData.slice(-30).map((msg: any) => ({
                                            id: msg._id,
                                            content: msg.content,
                                            sender_id: msg.sender,
                                            is_read: msg.isRead,
                                            created_at: msg.createdAt,
                                            message_type: msg.messageType,
                                            isUploading: false
                                        }));
                                        safeLocalStorageSet(`msgs_${otherId}`, formattedMsgs, 30);
                                    }
                                }
                            } catch (e) { console.warn('[Prefetch] Messages failed', e) }
                        });
                    }
                }
            })
            .catch(e => console.warn('[Prefetch] Convos failed', e));

        // 2. Fetch Matches & Likes
        const matchesPromise = fetch(`${API_BASE_URL}/api/user/matches`, { headers })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) safeLocalStorageSet(`matches_${userId}`, data);
            })
            .catch(e => console.warn('[Prefetch] Matches failed', e));

        const likesPromise = fetch(`${API_BASE_URL}/api/user/likes`, { headers })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) safeLocalStorageSet(`likes_received_${userId}`, data);
            })
            .catch(e => console.warn('[Prefetch] Likes failed', e));

        // 3. Fetch Notifications count to badge the icons
        const notificationsPromise = fetch(`${API_BASE_URL}/api/notifications`, { headers })
            .catch(e => console.warn('[Prefetch] Notifications failed', e));

        // Run all in parallel without blocking UI
        await Promise.allSettled([
            convosPromise,
            matchesPromise,
            likesPromise,
            notificationsPromise
        ]);

        console.log('[Prefetch] Background sync complete.');
    } catch (error) {
        console.error('[Prefetch] Fatal error during prefetch:', error);
    }
};
