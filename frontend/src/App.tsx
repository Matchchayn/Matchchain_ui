import './index.css'
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './client'
import type { Session } from '@supabase/supabase-js'
import Login from './components/Login'
import Signup from './components/Signup'
import ForgotPassword from './components/ForgotPassword'
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
  const [onboardingStep, setOnboardingStep] = useState<number>(0)
  // Loading state removed - no loading screens
  const { alert, showAlert, closeAlert } = useAlert()

  useEffect(() => {
    // Check if OAuth was cancelled (error in URL)
    const urlParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const error = urlParams.get('error') || hashParams.get('error')

    if (error === 'access_denied') {
      // OAuth was cancelled, redirect to login
      window.location.href = `${window.location.origin}/login`
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Check if signup is in progress
      const signupInProgress = localStorage.getItem('signup_in_progress')
      const needsPassword = localStorage.getItem('signup_needs_password')
      const passwordResetInProgress = localStorage.getItem('password_reset_in_progress')

      setSession(session)

      // Don't check onboarding if user is still in signup flow or resetting password
      if (signupInProgress || needsPassword || passwordResetInProgress) {
        return
      }

      // Only check onboarding on SIGNED_IN event, not on every auth change
      // This prevents unnecessary re-checks that can cause flicker/redirects
      if (session && event === 'SIGNED_IN') {
        checkUserOnboarding(session.user.id)
      } else if (!session) {
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
            // Check if user has uploaded intro video OR profile picture (photo with display_order 1)
            const { data: videoData } = await supabase
              .from('user_media')
              .select('id')
              .eq('user_id', userId)
              .eq('media_type', 'intro_video')
              .maybeSingle()

            const { data: photoData } = await supabase
              .from('user_media')
              .select('id')
              .eq('user_id', userId)
              .eq('media_type', 'photo')
              .eq('display_order', 1)
              .maybeSingle()

            // User has completed media if they have both intro video AND profile picture
            const hasCompletedMedia = !!videoData && !!photoData
            setHasMedia(hasCompletedMedia)
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
    setOnboardingStep(2)
  }

  const handleInterestsComplete = () => {
    setHasInterests(true)
    setOnboardingStep(3)
  }

  const handlePreferencesComplete = () => {
    setHasPreferences(true)
    setOnboardingStep(4)
  }

  const handleMediaComplete = async () => {
    setHasMedia(true)
    setOnboardingStep(0) // Reset onboarding step

    // Clear signup_in_progress flag now that onboarding is complete
    localStorage.removeItem('signup_in_progress')

    // Force re-check onboarding to ensure all data is synced
    if (session) {
      await checkUserOnboarding(session.user.id)
    }

    showAlert('Welcome to MatchChayn! Your profile is complete.', 'success')
  }

  const handleBackToProfile = () => {
    setOnboardingStep(1)
  }

  const handleBackToInterests = () => {
    setOnboardingStep(2)
  }

  const handleBackToPreferences = () => {
    setOnboardingStep(3)
  }

  // Remove loading screen - let content load in background

  // Check if signup is in progress
  const signupInProgress = localStorage.getItem('signup_in_progress')
  const needsPassword = localStorage.getItem('signup_needs_password')
  const passwordResetInProgress = localStorage.getItem('password_reset_in_progress')

  // If password reset is in progress, show forgot password page (even if session exists)
  if (passwordResetInProgress) {
    return (
      <Router>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<Navigate to="/forgot-password" replace />} />
        </Routes>
      </Router>
    )
  }

  // If no session, show login/signup/forgot-password pages
  if (!session) {
    return (
      <Router>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    )
  }

  // If user needs to set password (in middle of signup flow), show signup page
  if (needsPassword) {
    return (
      <Router>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/signup" replace />} />
        </Routes>
      </Router>
    )
  }

  // If signupInProgress is set but no needsPassword, user is in onboarding flow
  // Let them proceed through onboarding steps below

  // Only show onboarding steps if onboardingStep is explicitly set (for back navigation)
  // OR if the step is actually incomplete

  // Step 1: Complete Profile
  if (onboardingStep === 1 || (hasProfile === false && onboardingStep === 0)) {
    return <ProfileCreation session={session} onComplete={handleProfileComplete} />
  }

  // Step 2: Select Interests
  if (onboardingStep === 2 || (hasInterests === false && hasProfile === true && onboardingStep === 0)) {
    return <InterestSelection session={session} onComplete={handleInterestsComplete} onBack={handleBackToProfile} />
  }

  // Step 3: Set Preferences
  if (onboardingStep === 3 || (hasPreferences === false && hasInterests === true && onboardingStep === 0)) {
    return <PreferencesSelection session={session} onComplete={handlePreferencesComplete} onBack={handleBackToInterests} />
  }

  // Step 4: Upload Media
  if (onboardingStep === 4 || (hasMedia === false && hasPreferences === true && onboardingStep === 0)) {
    return <MediaUpload session={session} onComplete={handleMediaComplete} onBack={handleBackToPreferences} />
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