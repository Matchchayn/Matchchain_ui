import { API_BASE_URL } from '../config';
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
export async function fetchLikes(token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/likes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch likes');
    return await response.json();
  } catch (error) {
    console.error('Error fetching likes:', error)
    return []
  }
}

/**
 * Fetch all profiles that the current user has liked (Outgoing Likes)
 */
export async function fetchLikedProfiles(token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/liked-profiles`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch liked profiles');
    const data = await response.json();

    // Map backend fields to the common UserProfile format
    return data.map((user: any) => ({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      gender: user.gender,
      city: user.city || 'Unknown'
    }));
  } catch (error) {
    console.error('Error fetching liked profiles:', error)
    return []
  }
}

/**
 * Fetch all verified matches
 */
export async function fetchMatches(token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/matches`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch matches');
    return await response.json();
  } catch (error) {
    console.error('Error fetching matches:', error)
    return []
  }
}
