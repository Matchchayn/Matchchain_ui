
/**
 * Utility to safely handle localStorage operations with cleanup on quota limits.
 */

const NON_CRITICAL_PREFIXES = ['msgs_', 'cached_events', 'cached_matching_profiles', 'event_detail_', 'matches_', 'likes_received_'];
const SECONDARY_CRITICAL_PREFIXES = ['convos_', 'stories_'];

const isQuotaExceeded = (e: any) => {
    return e && (
        e.code === 22 ||
        e.code === 1014 ||
        e.name === 'QuotaExceededError' ||
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        (e.message && e.message.toLowerCase().includes('quota'))
    );
};

const cleanupStorage = (prefixes: string[], exceptKey?: string) => {
    let removedCount = 0;
    Object.keys(localStorage).forEach(key => {
        if (key === exceptKey || key === 'token' || key === 'user') return;

        if (prefixes.some(p => key.startsWith(p))) {
            localStorage.removeItem(key);
            removedCount++;
        }
    });
    console.log(`[Storage] Cleanup removed ${removedCount} items.`);
};

const sanitizeForStorage = (data: any): any => {
    if (!data) return data;
    if (Array.isArray(data)) {
        return data.map(item => sanitizeForStorage(item));
    }
    if (typeof data === 'object') {
        const cleaned = { ...data };
        // Clean avatarUrl if it's a huge base64 string
        if (cleaned.avatarUrl && cleaned.avatarUrl.length > 2000) {
            cleaned.avatarUrl = null;
        }
        if (cleaned.other_user && cleaned.other_user.avatar_url && cleaned.other_user.avatar_url.length > 2000) {
            cleaned.other_user.avatar_url = null;
        }
        // Do the same for any nested properties
        for (const key in cleaned) {
            if (typeof cleaned[key] === 'object' && cleaned[key] !== null) {
                cleaned[key] = sanitizeForStorage(cleaned[key]);
            }
        }
        return cleaned;
    }
    return data;
};

export const safeLocalStorageSet = (key: string, value: any, truncateLimit = 20) => {
    try {
        let finalValue = value;

        // If it's an array and too long, truncate it
        if (Array.isArray(value) && value.length > truncateLimit) {
            finalValue = value.slice(0, truncateLimit);
        }

        finalValue = sanitizeForStorage(finalValue);

        const stringValue = typeof finalValue === 'string' ? finalValue : JSON.stringify(finalValue);

        try {
            localStorage.setItem(key, stringValue);
            return true;
        } catch (e) {
            if (isQuotaExceeded(e)) {
                console.warn(`[Storage] Quota exceeded while saving ${key}. Attempting cleanup...`);

                // 1. Clear non-critical data first
                cleanupStorage(NON_CRITICAL_PREFIXES);

                try {
                    localStorage.setItem(key, stringValue);
                    console.log(`[Storage] Saved ${key} after non-critical cleanup.`);
                    return true;
                } catch (e2) {
                    // 2. If still failing and this is critical, clear secondary critical data
                    if (!NON_CRITICAL_PREFIXES.some(p => key.startsWith(p))) {
                        console.warn(`[Storage] Still full. Clearing secondary critical data...`);
                        cleanupStorage(SECONDARY_CRITICAL_PREFIXES, key); // Don't clear itself

                        try {
                            localStorage.setItem(key, stringValue);
                            console.log(`[Storage] Saved ${key} after aggressive cleanup.`);
                            return true;
                        } catch (e3) {
                            console.error(`[Storage] CRITICAL FAILURE: Could not save ${key} even after full cleanup.`, e3);
                        }
                    }
                }
            } else {
                throw e;
            }
        }
    } catch (err) {
        console.error(`[Storage] Error in safeLocalStorageSet for ${key}:`, err);
    }
    return false;
};
