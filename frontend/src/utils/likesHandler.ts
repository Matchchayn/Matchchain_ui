import { supabase } from '../client'

/**
 * Handle liking a profile
 * Creates a record in user_likes table to track who liked whom
 */
export async function likeProfile(
  currentUserId: string,
  likedUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if already liked
    const { data: existing } = await supabase
      .from('user_likes')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('liked_user_id', likedUserId)
      .single()

    if (existing) {
      return { success: false, error: 'Already liked this profile' }
    }

    // Insert like record
    const { error } = await supabase
      .from('user_likes')
      .insert({
        user_id: currentUserId,
        liked_user_id: likedUserId,
        created_at: new Date().toISOString()
      })

    if (error) throw error

    // Check if it's a match (both users liked each other)
    const { data: mutualLike } = await supabase
      .from('user_likes')
      .select('id')
      .eq('user_id', likedUserId)
      .eq('liked_user_id', currentUserId)
      .single()

    if (mutualLike) {
      // Create a match record
      await supabase
        .from('matches')
        .insert({
          user1_id: currentUserId,
          user2_id: likedUserId,
          created_at: new Date().toISOString()
        })

      return { success: true, error: "It's a match!" }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error liking profile:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Fetch all profiles that the current user has liked
 */
export async function fetchLikedProfiles(currentUserId: string) {
  try {
    const { data: likes, error } = await supabase
      .from('user_likes')
      .select('liked_user_id')
      .eq('user_id', currentUserId)

    if (error) throw error

    if (!likes || likes.length === 0) {
      return []
    }

    const likedUserIds = likes.map(like => like.liked_user_id)

    // Fetch profile details for all liked users
    const { data: profiles } = await supabase
      .from('Profile')
      .select('id, first_name, last_name, bio, city, country, gender, dateofbirth, relationshipstatus')
      .in('id', likedUserIds)

    if (!profiles) return []

    // Fetch media and interests for each profile
    const profilesWithData = await Promise.all(
      profiles.map(async (profile) => {
        // Get first photo or video
        const { data: media } = await supabase
          .from('user_media')
          .select('media_url, media_type')
          .eq('user_id', profile.id)
          .order('display_order', { ascending: true })
          .limit(1)
          .single()

        let photoUrl = null
        let mediaType = null
        if (media?.media_url) {
          const { data: { publicUrl } } = supabase.storage
            .from('user-videos')
            .getPublicUrl(media.media_url)
          photoUrl = publicUrl
          mediaType = media.media_type
        }

        // Get interests
        const { data: userInterests } = await supabase
          .from('user_interests')
          .select('interest_id, interests(name)')
          .eq('user_id', profile.id)
          .limit(2)

        const interests = userInterests?.map((ui: any) => ui.interests.name) || []

        return {
          id: profile.id,
          first_name: profile.first_name || 'Unknown',
          last_name: profile.last_name || '',
          bio: profile.bio || '',
          city: profile.city || 'Unknown',
          country: profile.country || '',
          gender: profile.gender || '',
          dateofbirth: profile.dateofbirth || '',
          relationshipstatus: profile.relationshipstatus || '',
          photoUrl,
          mediaType,
          distance: Math.floor(Math.random() * 100) + 1,
          interests
        }
      })
    )

    return profilesWithData
  } catch (error) {
    console.error('Error fetching liked profiles:', error)
    return []
  }
}

/**
 * Unlike a profile
 */
export async function unlikeProfile(
  currentUserId: string,
  likedUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_likes')
      .delete()
      .eq('user_id', currentUserId)
      .eq('liked_user_id', likedUserId)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Error unliking profile:', error)
    return { success: false, error: error.message }
  }
}
