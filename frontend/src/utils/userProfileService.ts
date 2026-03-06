import { API_BASE_URL } from '../config'
import { safeLocalStorageSet } from './storageUtils';;
// A simple cache to avoid fetching the profile multiple times concurrently
let profilePromise: Promise<any> | null = null;
let profileCache: any = null;

const STORAGE_KEY = 'user';

export const getCachedProfile = () => {
    if (profileCache) return profileCache;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            profileCache = JSON.parse(stored);
            return profileCache;
        } catch (e) { }
    }
    return null;
};

export const fetchUserProfile = async (token: string, forceRefresh = false) => {
    if (!token) return null;

    if (profileCache && !forceRefresh && profileCache.avatarUrl !== null) {
        return profileCache;
    }

    if (profilePromise && !forceRefresh) {
        return profilePromise;
    }

    profilePromise = fetch(`${API_BASE_URL}/api/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(async (res) => {
            if (!res.ok) {
                throw new Error('Failed to fetch profile');
            }
            const data = await res.json();
            profileCache = data; // store the cache
            safeLocalStorageSet(STORAGE_KEY, data);
            return data;
        })
        .catch((err) => {
            profilePromise = null; // reset if fails
            throw err;
        });

    return profilePromise;
};

export const clearProfileCache = () => {
    profileCache = null;
    profilePromise = null;
    localStorage.removeItem(STORAGE_KEY);
};
