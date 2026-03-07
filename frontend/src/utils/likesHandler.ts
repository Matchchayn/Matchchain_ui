import { API_BASE_URL } from '../config';

const CACHE_TTL = 30000; // 30 seconds

let likesCache: any = null;
let likesLastFetch = 0;

let likedProfilesCache: any = null;
let likedProfilesLastFetch = 0;

let matchesCache: any = null;
let matchesLastFetch = 0;

export const clearLikesCache = () => {
  likesCache = null;
  likedProfilesCache = null;
  matchesCache = null;
  likesLastFetch = 0;
  likedProfilesLastFetch = 0;
  matchesLastFetch = 0;
};

// Return last-known data so switching back to Matches/Likes tab shows content immediately (no refresh flash).
// TTL is still used inside fetchLikes/fetchMatches/fetchLikedProfiles to skip network when fresh.
export const getLikesCache = () => likesCache;
export const getMatchesCache = () => matchesCache;
export const getLikedProfilesCache = () => likedProfilesCache;

/**
 * Handle liking a profile using MongoDB backend
 */
export async function likeProfile(
  token: string,
  likedUserId: string
): Promise<{ success: boolean; isMatch?: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ targetUserId: likedUserId })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to like profile');

    // Invalidate caches since we interacted
    clearLikesCache();

    return {
      success: true,
      isMatch: data.isMatch,
      error: data.isMatch ? "It's a match!" : undefined
    };
  } catch (error: any) {
    console.error('Error liking profile:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Fetch all profiles that liked the current user (Received Likes)
 */
export async function fetchLikes(token: string, forceRefresh = false) {
  if (!forceRefresh && likesCache && Date.now() - likesLastFetch < CACHE_TTL) {
    return likesCache;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/likes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      console.error(`fetchLikes failed with status: ${response.status}`);
      throw new Error('Failed to fetch likes');
    }
    const data = await response.json();
    likesCache = data;
    likesLastFetch = Date.now();
    return data;
  } catch (error) {
    console.error('Error fetching likes:', error)
    return []
  }
}

/**
 * Fetch all profiles that the current user has liked (Outgoing Likes)
 */
export async function fetchLikedProfiles(token: string, forceRefresh = false) {
  if (!forceRefresh && likedProfilesCache && Date.now() - likedProfilesLastFetch < CACHE_TTL) {
    return likedProfilesCache;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/liked-profiles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      console.error(`fetchLikedProfiles failed with status: ${response.status}`);
      throw new Error('Failed to fetch liked profiles');
    }
    const data = await response.json();

    // Map backend fields to the common UserProfile format
    const mapped = data.map((user: any) => ({
      ...user,
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      gender: user.gender,
      city: user.city || 'Unknown'
    }));

    likedProfilesCache = mapped;
    likedProfilesLastFetch = Date.now();
    return mapped;
  } catch (error) {
    console.error('Error fetching liked profiles:', error)
    return []
  }
}

/**
 * Fetch all verified matches
 */
export async function fetchMatches(token: string, forceRefresh = false) {
  if (!forceRefresh && matchesCache && Date.now() - matchesLastFetch < CACHE_TTL) {
    return matchesCache;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/matches`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      console.error(`fetchMatches failed with status: ${response.status}`);
      throw new Error('Failed to fetch matches');
    }
    const data = await response.json();
    matchesCache = data;
    matchesLastFetch = Date.now();
    return data;
  } catch (error) {
    console.error('Error fetching matches:', error)
    return []
  }
}
