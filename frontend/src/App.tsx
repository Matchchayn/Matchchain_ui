import './index.css'
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './client'
import type { Session } from '@supabase/supabase-js'
import Login from './components/Login'
import Signup from './components/Signup'
import Home from './Home/index'
import Settings from './Settings'
import Likes from './components/Likes'
import ProfileCreation from './components/Onboarding/ProfileCreation'
import InterestSelection from './components/Onboarding/InterestSelection'
import PreferencesSelection from './components/Onboarding/PreferencesSelection'
import MediaUpload from './components/Onboarding/MediaUpload'
import Alert from './components/Alert'
// Loader component removed - no loading screens
import { useAlert } from './hooks/useAlert'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [hasInterests, setHasInterests] = useState<boolean | null>(null)
  const [hasPreferences, setHasPreferences] = useState<boolean | null>(null)
  const [hasMedia, setHasMedia] = useState<boolean | null>(null)
  // Loading state removed - no loading screens
  const { alert, showAlert, closeAlert } = useAlert()

  useEffect(() => {
    // Check if OAuth was cancelled (error in URL)
    const urlParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const error = urlParams.get('error') || hashParams.get('error')
    const errorDescription = urlParams.get('error_description') || hashParams.get('error_description')

    if (error === 'access_denied') {
      // OAuth was cancelled, redirect to login
      window.location.href = 'https://matchchain-ui.vercel.app/login'
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      // Check if signup is in progress
      const signupInProgress = localStorage.getItem('signup_in_progress')

      setSession(session)
      if (session && !signupInProgress) {
        checkUserOnboarding(session.user.id)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Check if signup is in progress
      const signupInProgress = localStorage.getItem('signup_in_progress')

      setSession(session)
      if (session && !signupInProgress) {
        checkUserOnboarding(session.user.id)
      } else {
        setHasProfile(null)
        setHasInterests(null)
        setHasPreferences(null)
        setHasMedia(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkUserOnboarding(userId: string) {
    try {
      // Check if profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('Profile')
        .select('first_name')
        .eq('id', userId)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      const profileExists = profileData && profileData.first_name
      setHasProfile(!!profileExists)

      // Check interests if profile is complete
      if (profileExists) {
        const { data: interestsData, error: interestsError } = await supabase
          .from('user_interests')
          .select('id')
          .eq('user_id', userId)
          .limit(1)

        if (interestsError) throw interestsError
        const interestsExist = interestsData && interestsData.length > 0
        setHasInterests(!!interestsExist)

        // Check preferences if interests are complete
        if (interestsExist) {
          const { data: preferencesData, error: preferencesError } = await supabase
            .from('user_preferences')
            .select('id')
            .eq('user_id', userId)
            .single()

          if (preferencesError && preferencesError.code !== 'PGRST116') {
            throw preferencesError
          }

          const preferencesExist = !!preferencesData
          setHasPreferences(preferencesExist)

          // Check media if preferences are complete
          if (preferencesExist) {
            const { data: mediaData, error: mediaError } = await supabase
              .from('user_media')
              .select('id')
              .eq('user_id', userId)
              .eq('media_type', 'intro_video')
              .single()

            if (mediaError && mediaError.code !== 'PGRST116') {
              throw mediaError
            }

            setHasMedia(!!mediaData)
          } else {
            setHasMedia(false)
          }
        } else {
          setHasPreferences(false)
          setHasMedia(false)
        }
      } else {
        setHasInterests(false)
        setHasPreferences(false)
        setHasMedia(false)
      }
    } catch (error) {
      console.error('Error checking onboarding:', error)
      setHasProfile(false)
      setHasInterests(false)
      setHasPreferences(false)
      setHasMedia(false)
    }
  }

  const handleProfileComplete = () => {
    setHasProfile(true)
  }

  const handleInterestsComplete = () => {
    setHasInterests(true)
  }

  const handlePreferencesComplete = () => {
    setHasPreferences(true)
  }

  const handleMediaComplete = () => {
    setHasMedia(true)
    showAlert('Welcome to MatchChayn! Your profile is complete.', 'success')
  }

  // Remove loading screen - let content load in background

  // Check if signup is in progress
  const signupInProgress = localStorage.getItem('signup_in_progress')

  if (!session || signupInProgress) {
    return (
      <Router>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to={signupInProgress ? "/signup" : "/login"} replace />} />
        </Routes>
      </Router>
    )
  }

  // Step 1: Complete Profile
  if (hasProfile === false) {
    return <ProfileCreation session={session} onComplete={handleProfileComplete} />
  }

  // Step 2: Select Interests
  if (hasInterests === false) {
    return <InterestSelection session={session} onComplete={handleInterestsComplete} />
  }

  // Step 3: Set Preferences
  if (hasPreferences === false) {
    return <PreferencesSelection session={session} onComplete={handlePreferencesComplete} />
  }

  // Step 4: Upload Media
  if (hasMedia === false) {
    return <MediaUpload session={session} onComplete={handleMediaComplete} />
  }

  // Remove loading screen - let onboarding states load in background

  // Step 5: Go to Home
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home session={session} />} />
          <Route path="/likes" element={<Likes session={session} />} />
          <Route path="/settings" element={<Settings session={session} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      {alert && <Alert message={alert.message} type={alert.type} onClose={closeAlert} />}
    </>
  )
}