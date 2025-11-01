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
  if (!dateOfBirth) {
    console.log('No date of birth provided')
    return -1
  }

  const today = new Date()
  const birth = new Date(dateOfBirth)

  // Check if date is valid
  if (isNaN(birth.getTime())) {
    console.log(`Invalid date format: ${dateOfBirth}`)
    return -1
  }

  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  console.log(`Calculated age from ${dateOfBirth}: ${age}`)
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

    // AUTOMATIC OPPOSITE GENDER MATCHING
    // If user is male → show only females
    // If user is female → show only males
    const oppositeGender = currentUserProfile.gender === 'male' ? 'female' : 'male'
    query = query.eq('gender', oppositeGender)

    // Filter by relationship status preference
    if (prefs.looking_for_relationship_status && prefs.looking_for_relationship_status !== 'any') {
      query = query.eq('relationshipstatus', prefs.looking_for_relationship_status)
    }

    console.log('Matching algorithm filters:', {
      currentUserGender: currentUserProfile.gender,
      showingGender: oppositeGender,
      lookingForRelationship: prefs.looking_for_relationship_status,
      ageRange: `${prefs.age_min}-${prefs.age_max}`,
      distanceKm: prefs.distance_km
    })

    const { data: profiles, error: profilesError } = await query

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return []
    }

    console.log(`Found ${profiles?.length || 0} profiles with opposite gender (${oppositeGender})`)

    if (!profiles || profiles.length === 0) {
      console.log('No profiles found matching gender filter')
      return []
    }

    // 4. Filter by age range (client-side filtering since we need to calculate age)
    const filteredByAge = profiles.filter((profile) => {
      if (!profile.dateofbirth) {
        console.log(`Profile ${profile.id} has no date of birth - excluded`)
        return false
      }
      const age = calculateAge(profile.dateofbirth)
      const matches = age >= prefs.age_min && age <= prefs.age_max
      if (!matches) {
        console.log(`Profile ${profile.id} age ${age} not in range ${prefs.age_min}-${prefs.age_max} - excluded`)
      }
      return matches
    })

    console.log(`After age filter: ${filteredByAge.length} profiles`)

    // 5. Fetch media and interests for each matching profile
    const profilesWithData = await Promise.all(
      filteredByAge.map(async (profile) => {
        // First, try to get the intro video (media_type = 'intro_video')
        const { data: introVideo } = await supabase
          .from('user_media')
          .select('media_url, media_type')
          .eq('user_id', profile.id)
          .eq('media_type', 'intro_video')
          .single()

        let photoUrl = null
        let mediaType = null

        if (introVideo?.media_url) {
          // Use intro video if available
          const { data: { publicUrl } } = supabase.storage
            .from('user-videos')
            .getPublicUrl(introVideo.media_url)
          photoUrl = publicUrl
          mediaType = 'video' as const
        } else {
          // Fallback to first photo if no intro video
          const { data: firstPhoto } = await supabase
            .from('user_media')
            .select('media_url, media_type')
            .eq('user_id', profile.id)
            .eq('media_type', 'photo')
            .order('display_order', { ascending: true })
            .limit(1)
            .single()

          if (firstPhoto?.media_url) {
            const { data: { publicUrl } } = supabase.storage
              .from('user-videos')
              .getPublicUrl(firstPhoto.media_url)
            photoUrl = publicUrl
            mediaType = 'photo' as const
          }
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

    // 6. Filter out profiles without any media (no photo or video)
    const profilesWithMedia = profilesWithData.filter(profile => profile.photoUrl !== null)

    console.log(`After media filter: ${profilesWithMedia.length} profiles (excluded ${profilesWithData.length - profilesWithMedia.length} without media)`)

    // 7. Shuffle results for variety
    return shuffleArray(profilesWithMedia)
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
