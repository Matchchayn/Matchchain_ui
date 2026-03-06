import { API_BASE_URL } from '../config';

let eventsPromise: Promise<any> | null = null;
let eventsCache: any = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 30000; // 30 seconds

export const fetchEvents = async (token: string, forceRefresh = false) => {
    if (!token) return [];

    const now = Date.now();
    const isCacheExpired = (now - lastFetchTime) > CACHE_DURATION;

    if (eventsCache && !forceRefresh && !isCacheExpired) {
        return eventsCache;
    }

    if (eventsPromise && !forceRefresh && !isCacheExpired) {
        return eventsPromise;
    }

    eventsPromise = fetch(`${API_BASE_URL}/api/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(async (res) => {
            if (!res.ok) {
                throw new Error('Failed to fetch events');
            }
            const data = await res.json();
            eventsCache = data;
            lastFetchTime = Date.now();
            return data;
        })
        .catch((err) => {
            eventsPromise = null;
            throw err;
        });

    return eventsPromise;
};

export const fetchEventDetails = async (token: string, id: string, _forceRefresh = false) => {
    if (!token || !id) return null;

    // Optional: We could cache individual event details as well, but for now let's just use the same logic
    // or check if it's in the eventsCache already.

    return fetch(`${API_BASE_URL}/api/events/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    }).then(async res => {
        if (!res.ok) throw new Error('Failed to fetch event details');
        return await res.json();
    });
};

export const clearEventsCache = () => {
    eventsCache = null;
    eventsPromise = null;
    lastFetchTime = 0;
};
