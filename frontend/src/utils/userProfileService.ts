import { API_BASE_URL } from '../config';
// A simple cache to avoid fetching the profile multiple times concurrently
let profilePromise: Promise<any> | null = null;
let profileCache: any = null;

export const fetchUserProfile = async (token: string, forceRefresh = false) => {
    if (!token) return null;

    if (profileCache && !forceRefresh) {
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
};
