import { API_BASE_URL } from '../config';

interface StatusUser {
    _id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
}

interface Status {
    _id: string;
    user: StatusUser;
    imageUrl: string;
    text?: string;
    createdAt: string;
}

class StoriesService {
    private stories: Status[] = [];
    private lastFetch: number = 0;
    private fetchPromise: Promise<Status[]> | null = null;
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    getStories() {
        return this.stories;
    }

    setStories(data: Status[]) {
        this.stories = data;
        this.lastFetch = Date.now();
    }

    async fetchStories(token: string, forceRefresh = false): Promise<Status[]> {
        if (!token) return [];

        console.log(`StoriesService - Starting fetch. Current stories in memory: ${this.stories.length}. Time since last: ${Math.round((Date.now() - this.lastFetch) / 1000)}s`);

        // Return current stories if they are fresh and we aren't forcing a refresh
        if (!forceRefresh && this.stories.length > 0 && (Date.now() - this.lastFetch < this.CACHE_TTL)) {
            console.log('StoriesService - Returning cached stories (Ref: same array)');
            return this.stories;
        }

        // Avoid concurrent fetches
        if (this.fetchPromise && !forceRefresh) {
            console.log('StoriesService - Fetch already in progress, joining promise...');
            return this.fetchPromise;
        }

        console.log('StoriesService - Fetching fresh stories from server...');
        this.fetchPromise = fetch(`${API_BASE_URL}/api/status/feed`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(async (res) => {
                const startTime = Date.now();
                if (!res.ok) {
                    console.error(`StoriesService - ERROR: Server returned ${res.status}`);
                    throw new Error(`Fetch failed with status: ${res.status}`);
                }
                const data = await res.json();
                console.log(`StoriesService - SUCCESS: Received ${data.length} items from server. Update took ${Date.now() - startTime}ms`);

                // Only update if we got actual data or if we want to clear (though normally feed shouldn't be empty if user has matches)
                this.stories = data;
                this.lastFetch = Date.now();
                this.fetchPromise = null;
                return data;
            })
            .catch((err) => {
                console.error('StoriesService - FATAL CATCH:', err.message);
                this.fetchPromise = null;
                console.log(`StoriesService - Recovering with stale cache: ${this.stories.length} existing items`);
                return this.stories; // Return stale if fetch fails
            });

        return this.fetchPromise;
    }

    clearCache() {
        this.stories = [];
        this.lastFetch = 0;
    }
}

export const storiesService = new StoriesService();
export type { Status, StatusUser };
