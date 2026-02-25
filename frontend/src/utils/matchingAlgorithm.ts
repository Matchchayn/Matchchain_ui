import { API_BASE_URL } from '../config';
export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  bio: string
  city: string
  country: string
  gender: string
  dateOfBirth: string
  relationshipStatus: string
  avatarUrl: string | null
  secondaryPhotoUrl?: string
  videoUrl?: string
  interests: string[]
  distance?: number
}

/**
 * Fetch matching profiles based on user's preferences from the MONGODB backend
 */
export async function fetchMatchingProfiles(
  token: string
): Promise<UserProfile[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/matches-feed`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) return [];

    const data = await response.json();

    // Map MongoDB fields to the component expected format if necessary
    return data.map((user: any) => ({
      id: user._id,
      firstName: user.firstName || 'Unknown',
      lastName: user.lastName || '',
      bio: user.bio || '',
      city: user.city || '',
      country: user.country || '',
      gender: user.gender || '',
      dateOfBirth: user.dateOfBirth || '',
      relationshipStatus: user.relationshipStatus || '',
      avatarUrl: user.avatarUrl || null,
      secondaryPhotoUrl: user.secondaryPhotoUrl,
      videoUrl: user.videoUrl,
      interests: user.interests || [],
      distance: Math.floor(Math.random() * 20) + 1 // placeholder distance
    }));

  } catch (error) {
    return []
  }
}

export async function likeUser(token: string, targetUserId: string) {
  const response = await fetch(`${API_BASE_URL}/api/user/like`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ targetUserId })
  });
  return await response.json();
}
