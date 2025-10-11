import { supabase } from '../client'

export interface UserProfile {
  id: string
  first_name: string
  last_name: string
  bio: string
  city: string
  country: string
  gender: string
  dateofbirth: string
  relationshipstatus: string
  photoUrl: string | null
  mediaType: 'photo' | 'video' | null
  distance: number
  interests: string[]
}

export interface UserPreferences {
  looking_for_gender: string
  looking_for_relationship_status: string
  distance_km: number
  age_min: number
  age_max: number
  height_min_cm: number
  height_max_cm: number
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birth = new Date(dateOfBirth)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

/**
 * Fetch matching profiles based on user's gender and preferences
 */
export async function fetchMatchingProfiles(
  currentUserId: string
): Promise<UserProfile[]> {
  try {
    // 1. Get current user's profile (to know their gender)
    const { data: currentUserProfile, error: currentUserError } = await supabase
      .from('Profile')
      .select('gender')
      .eq('id', currentUserId)
      .single()

    if (currentUserError || !currentUserProfile) {
      console.error('Error fetching current user profile:', currentUserError)
      return []
    }

    // 2. Get current user's preferences
    const { data: userPreferences, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', currentUserId)
      .single()

    if (preferencesError || !userPreferences) {
      console.error('Error fetching user preferences:', preferencesError)
      // If no preferences, return empty array
      return []
    }

    const prefs = userPreferences as UserPreferences

    // 3. Build query to fetch matching profiles
    let query = supabase
      .from('Profile')
      .select('id, first_name, last_name, bio, city, country, gender, dateofbirth, relationshipstatus')
      .neq('id', currentUserId) // Exclude current user

    // ALWAYS filter by gender preference from user_preferences
    // If user selected "female", show only females
    // If user selected "male", show only males
    // If user selected "any", show all genders
    if (prefs.looking_for_gender && prefs.looking_for_gender !== 'any') {
      query = query.eq('gender', prefs.looking_for_gender)
    }

    // Filter by relationship status preference
    if (prefs.looking_for_relationship_status && prefs.looking_for_relationship_status !== 'any') {
      query = query.eq('relationshipstatus', prefs.looking_for_relationship_status)
    }

    console.log('Matching algorithm filters:', {
      currentUserGender: currentUserProfile.gender,
      lookingForGender: prefs.looking_for_gender,
      lookingForRelationship: prefs.looking_for_relationship_status
    })

    const { data: profiles, error: profilesError } = await query

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return []
    }

    if (!profiles || profiles.length === 0) {
      return []
    }

    // 4. Filter by age range (client-side filtering since we need to calculate age)
    const filteredByAge = profiles.filter((profile) => {
      if (!profile.dateofbirth) return false
      const age = calculateAge(profile.dateofbirth)
      return age >= prefs.age_min && age <= prefs.age_max
    })

    // 5. Fetch media and interests for each matching profile
    const profilesWithData = await Promise.all(
      filteredByAge.map(async (profile) => {
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
          mediaType = media.media_type as 'photo' | 'video'
        }

        // Get interests (limit to 2 for display)
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
          distance: Math.floor(Math.random() * prefs.distance_km) + 1, // Random distance within preference
          interests
        }
      })
    )

    // 6. Shuffle results for variety
    return shuffleArray(profilesWithData)
  } catch (error) {
    console.error('Error in fetchMatchingProfiles:', error)
    return []
  }
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
