import './index.css'
import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { VidbloqProvider } from "@vidbloq/react";
import { WalletContextProvider } from './contexts/WalletContextProvider'
import Login from './components/Auth/Login'
import Signup from './components/Auth/Signup'
import ForgotPassword from './components/Auth/ForgotPassword'
import Home from './Home/index'
import Settings from './Settings'
import Profile from './components/Profile'
import Likes from './components/Likes'
import MatchesLikes from './components/MatchesLikes'
import Messages from './components/Messages'
import Events from './components/Events'
import ProfileCreation from './components/Onboarding/ProfileCreation'
import InterestSelection from './components/Onboarding/InterestSelection'
import PreferencesSelection from './components/Onboarding/PreferencesSelection'
import MediaUpload from './components/Onboarding/MediaUpload'
import CreateEvent from './components/CreateEvent'
import EventDetails from './components/EventDetails'
import VidbloqWrapper from './components/video/vidbloq-wrapper'
import { useAlert } from './hooks/useAlert'
import TopLoader from './components/Common/TopLoader'
import ConnectivityStatus from './components/Common/ConnectivityStatus'
import IncomingCallModal from './components/Call/IncomingCallModal'
import CallScreen from './components/Call/CallScreen'
import PrivacyPolicy from './components/PrivacyPolicy'
import { socketService } from './utils/socketService'

import { GoogleOAuthProvider } from '@react-oauth/google'

import { fetchUserProfile } from './utils/userProfileService'

export default function App() {
  // Synchronously initialize state from localStorage to prevent UI flashing on refresh
  const [session, setSession] = useState<any>(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      try {
        return { user: JSON.parse(userStr), token }
      } catch (e) { }
    }
    return null
  })

  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [hasInterests, setHasInterests] = useState<boolean | null>(null)
  const [hasPreferences, setHasPreferences] = useState<boolean | null>(null)
  const [hasMedia, setHasMedia] = useState<boolean | null>(null)
  const [onboardingStep, setOnboardingStep] = useState<number>(0)

  const [isOnboardingChecked, setIsOnboardingChecked] = useState<boolean>(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (!token || !userStr) return true; // No session, show login instantly

    const isSignupFlow = localStorage.getItem('isSignupFlow') === 'true';
    if (!isSignupFlow) return true; // Not in signup, show home instantly

    try {
      const u = JSON.parse(userStr);
      const uid = u.id || u._id;
      const status = u.onboardingStatus;
      if (status === 'completed' || status === 'media_uploaded' || localStorage.getItem(`onboarding_completed_${uid}`) === 'true') {
        return true;
      }
    } catch (e) { }
    return false; // Active signup flow without completion caching, show top loader
  })
  const { showAlert } = useAlert()
  const [incomingCall, setIncomingCall] = useState<{
    callType: 'phone' | 'video'
    from: string
    callerName: string
    callerAvatar?: string
    offer: RTCSessionDescriptionInit
  } | null>(null)
  const [activeIncomingCall, setActiveIncomingCall] = useState<{
    callType: 'phone' | 'video'
    from: string
    callerName: string
    callerAvatar?: string
    offer: RTCSessionDescriptionInit
  } | null>(null)
  const apiKey = import.meta.env.VITE_VIDBLOQ_API_KEY || "";
  const apiSecret = import.meta.env.VITE_VIDBLOQ_API_SECRET || "";
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  const handleSignOut = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setSession(null)
    setIsOnboardingChecked(true)
  }

  const refreshSession = () => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    setIsOnboardingChecked(false); // Reset check status to avoid glimpses

    if (token && user) {
      try {
        const userObj = JSON.parse(user)
        const uid = userObj.id || userObj._id
        const status = userObj.onboardingStatus;
        setSession({ user: userObj, token })

        const isSignupFlow = localStorage.getItem('isSignupFlow') === 'true';

        if (!isSignupFlow || status === 'completed' || status === 'media_uploaded' || localStorage.getItem(`onboarding_completed_${uid}`) === 'true') {
          localStorage.removeItem('isSignupFlow');
          setHasProfile(true); setHasInterests(true); setHasPreferences(true); setHasMedia(true);
          setOnboardingStep(0);
          setIsOnboardingChecked(true); // <--- Set this IMMEDIATELY to prevent glimpse

          fetchUserProfile(token).then(u => {
            if (u) {
              localStorage.setItem('user', JSON.stringify(u));
              if (u.onboardingStatus === 'completed' || u.onboardingStatus === 'media_uploaded') {
                localStorage.setItem(`onboarding_completed_${uid}`, 'true');
              }
            }
          }).catch(e => console.error("Silent refresh failed:", e));
          return;
        }

        if (status && status !== 'started') {
          const profileDone = status !== 'profile_pending';
          const interestsDone = ['interests_selected', 'preferences_set', 'media_uploaded', 'completed'].includes(status);
          const preferencesDone = ['preferences_set', 'media_uploaded', 'completed'].includes(status);
          const mediaDone = status === 'media_uploaded' || status === 'completed';

          setHasProfile(profileDone);
          setHasInterests(interestsDone);
          setHasPreferences(preferencesDone);
          setHasMedia(mediaDone);

          if (!profileDone) setOnboardingStep(1);
          else if (!interestsDone) setOnboardingStep(2);
          else if (!preferencesDone) setOnboardingStep(3);
          else if (!mediaDone) setOnboardingStep(4);
          else setOnboardingStep(0);

          setIsOnboardingChecked(true);
          checkUserOnboarding(uid);
          return;
        }

        // If no status or incomplete, wait for server check before showing anything
        setOnboardingStep(1); // Default to first step if unsure
        checkUserOnboarding(uid)
      } catch (e) {
        console.error("Session refresh error:", e)
        handleSignOut() // Use existing signout logic
      }
    } else {
      setSession(null)
      setIsOnboardingChecked(true)
    }
  }

  useEffect(() => {
    refreshSession()
  }, [])

  // Keep a ref to the latest incomingCall setter so the socket listener never goes stale
  const incomingCallHandlerRef = useRef<(data: any) => void>(() => { })
  incomingCallHandlerRef.current = (data: any) => {
    console.log('📞 incoming_call event received:', data)
    setIncomingCall({
      callType: data.callType || 'phone',
      from: data.from,
      callerName: data.callerName || 'Someone',
      callerAvatar: data.callerAvatar,
      offer: data.offer,
    })
  }

  // Connect socket & register incoming call listener ONCE
  const socketListenerRegistered = useRef(false)
  useEffect(() => {
    if (session?.user) {
      // Use _id consistently as the primary identifier for sockets/signaling
      const uid = session.user._id || session.user.id
      if (uid) {
        socketService.connect(uid)
        console.log('🔌 Socket connection synchronized for user:', uid)

        // Only register the listener once
        if (!socketListenerRegistered.current) {
          const socket = socketService.getSocket()
          if (socket) {
            socket.on('incoming_call', (data: any) => {
              console.log('📞 Received incoming_call event on socket:', data)
              incomingCallHandlerRef.current(data)
            })
            socketListenerRegistered.current = true
            console.log('📞 Global incoming_call listener established')
          }
        }
      }
    }
    // NO cleanup — listener stays alive for the entire app lifecycle
  }, [session])

  const handleAcceptCall = () => {
    if (!incomingCall) return
    setActiveIncomingCall({
      callType: incomingCall.callType,
      from: incomingCall.from,
      callerName: incomingCall.callerName,
      callerAvatar: incomingCall.callerAvatar,
      offer: incomingCall.offer,
    })
    setIncomingCall(null)
  }

  const handleRejectCall = () => {
    if (!incomingCall) return
    const socket = socketService.getSocket()
    socket?.emit('call_reject', { to: incomingCall.from })
    setIncomingCall(null)
  }

  async function checkUserOnboarding(userId: string) {
    try {
      const token = localStorage.getItem('token')
      const user = await fetchUserProfile(token || '')

      if (!user) throw new Error('No user data returned')

      // Sync fresh data to localStorage
      localStorage.setItem('user', JSON.stringify(user))

      // Check server-side status (or local storage override if they skipped Media step)
      const onboardingCompletedLocally = localStorage.getItem(`onboarding_completed_${userId}`)

      if (user.onboardingStatus === 'completed' || user.onboardingStatus === 'media_uploaded' || onboardingCompletedLocally === 'true') {
        localStorage.setItem(`onboarding_completed_${userId}`, 'true')
        localStorage.removeItem('isSignupFlow')
        setHasInterests(true)
        setHasPreferences(true)
        setHasMedia(true)
        setHasProfile(true)
        setOnboardingStep(0)
        return
      }

      // Determine step based on data presence
      const profileDone = (user.onboardingStatus && user.onboardingStatus !== 'started') || (user.firstName && user.lastName)
      const interestsDone = ['interests_selected', 'preferences_set', 'media_uploaded', 'completed'].includes(user.onboardingStatus) || (user.interests && user.interests.length > 0)
      const preferencesDone = ['preferences_set', 'media_uploaded', 'completed'].includes(user.onboardingStatus) || (user.preferences && user.preferences.lookingForGender)
      const mediaDone = user.onboardingStatus === 'completed' || user.onboardingStatus === 'media_uploaded' || (user.avatarUrl && user.videoUrl)

      setHasProfile(profileDone)
      setHasInterests(interestsDone)
      setHasPreferences(preferencesDone)
      setHasMedia(mediaDone)

      // Set the active step to where they left off
      if (!profileDone) setOnboardingStep(1)
      else if (!interestsDone) setOnboardingStep(2)
      else if (!preferencesDone) setOnboardingStep(3)
      else if (!mediaDone) setOnboardingStep(4)
      else setOnboardingStep(0)

    } catch (error: any) {
      console.error('Onboarding check failed:', error)

      // Fallback: If network glitches, trust what we have in localStorage to avoid forcing onboarding
      const userStr = localStorage.getItem('user')
      const onboardFlag = localStorage.getItem(`onboarding_completed_${userId}`)

      if (onboardFlag === 'true') {
        setHasInterests(true); setHasPreferences(true); setHasMedia(true); setHasProfile(true);
        setOnboardingStep(0)
      } else if (userStr) {
        try {
          const localUser = JSON.parse(userStr)
          // If they have any sign of a completed profile (firstName exists) OR a positive status, don't reset them
          if (localUser.firstName || localUser.onboardingStatus === 'completed' || localUser.onboardingStatus === 'media_uploaded') {
            setHasProfile(true); setHasInterests(true); setHasPreferences(true); setHasMedia(true);
            setOnboardingStep(0)
          } else {
            // Only force onboarding if it's clearly a fresh account with no data
            setOnboardingStep(1)
          }
        } catch {
          setOnboardingStep(1)
        }
      } else {
        setOnboardingStep(1)
      }
    } finally {
      setIsOnboardingChecked(true)
    }
  }

  const handleProfileComplete = () => {
    setHasProfile(true)
    setOnboardingStep(2)
    // Persist partially completed state locally to survive glitches
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    localStorage.setItem('user', JSON.stringify({ ...user, onboardingStatus: 'profile_completed', firstName: 'Pending' }))
  }

  const handleInterestsComplete = () => {
    setHasInterests(true)
    setOnboardingStep(3)
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    localStorage.setItem('user', JSON.stringify({ ...user, onboardingStatus: 'interests_selected' }))
  }

  const handlePreferencesComplete = () => {
    setHasPreferences(true)
    setOnboardingStep(4)
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    localStorage.setItem('user', JSON.stringify({ ...user, onboardingStatus: 'preferences_set' }))
  }

  const handleMediaComplete = async () => {
    setHasMedia(true)
    setOnboardingStep(0)
    localStorage.removeItem('isSignupFlow')
    if (session) {
      const uid = session.user.id || session.user._id
      localStorage.setItem(`onboarding_completed_${uid}`, 'true')
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      localStorage.setItem('user', JSON.stringify({ ...user, onboardingStatus: 'completed' }))
    }
    showAlert('Welcome! Your profile is complete.', 'success')
  }

  const handleBackToProfile = () => setOnboardingStep(1)
  const handleBackToInterests = () => setOnboardingStep(2)
  const handleBackToPreferences = () => setOnboardingStep(3)

  if (!session) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        <ConnectivityStatus />
        <Router>
          <Routes>
            <Route path="/signup" element={<Signup onSignupSuccess={refreshSession} />} />
            <Route path="/login" element={<Login onLoginSuccess={refreshSession} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </GoogleOAuthProvider>
    )
  }

  // Prevent "Glimpse" of Home: Wait for onboarding status check to finish
  if (!isOnboardingChecked) {
    return (
      <div className="min-h-screen bg-[#090a1e]">
        <ConnectivityStatus />
        <TopLoader message="Loading..." />
      </div>
    )
  }

  // Onboarding logic: Profile -> Interests -> Preferences -> Media
  if (onboardingStep === 1 || (hasProfile === false && (onboardingStep === 0 || onboardingStep === 1))) {
    return (
      <>
        <ConnectivityStatus />
        <ProfileCreation session={session} onComplete={handleProfileComplete} />
      </>
    )
  }
  if (onboardingStep === 2 || (hasInterests === false && (onboardingStep === 0 || onboardingStep === 2))) {
    return (
      <>
        <ConnectivityStatus />
        <InterestSelection session={session} onComplete={handleInterestsComplete} onBack={handleBackToProfile} />
      </>
    )
  }
  if (onboardingStep === 3 || (hasPreferences === false && (onboardingStep === 0 || onboardingStep === 3))) {
    return (
      <>
        <ConnectivityStatus />
        <PreferencesSelection session={session} onComplete={handlePreferencesComplete} onBack={handleBackToInterests} />
      </>
    )
  }
  if (onboardingStep === 4 || (hasMedia === false && (onboardingStep === 0 || onboardingStep === 4))) {
    return (
      <>
        <ConnectivityStatus />
        <MediaUpload session={session} onComplete={handleMediaComplete} onBack={handleBackToPreferences} />
      </>
    )
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <WalletContextProvider>
        <ConnectivityStatus />
        <Router>
          <div className="transition-all duration-300 min-h-screen flex flex-col" style={{ paddingTop: 'var(--connectivity-height, 0px)' }}>
            <Routes>
              <Route path="/" element={<Home session={session} />} />
              <Route path="/likes" element={<Likes session={session} />} />
              <Route path="/matches" element={<MatchesLikes session={session} />} />
              <Route path="/profile" element={<Profile session={session} />} />
              <Route path="/messages" element={<Messages session={session} />} />
              <Route path="/events" element={<Events session={session} />} />
              <Route path="/events/:id" element={<EventDetails session={session} />} />
              <Route path="/events/create" element={<CreateEvent session={session} />} />
              <Route path="/events/edit/:id" element={<CreateEvent session={session} />} />
              <Route path="/settings" element={<Settings session={session} />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route
                path="/video-call/:sessionId"
                element={
                  <VidbloqProvider apiKey={apiKey} apiSecret={apiSecret}>
                    <VidbloqWrapper />
                  </VidbloqProvider>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>

        {/* Global Incoming Call Modal — works on any page */}
        {incomingCall && (
          <IncomingCallModal
            callType={incomingCall.callType}
            callerName={incomingCall.callerName}
            callerAvatar={incomingCall.callerAvatar}
            onAccept={handleAcceptCall}
            onReject={handleRejectCall}
          />
        )}

        {/* Global Call Screen for receiver */}
        {activeIncomingCall && session?.user && (
          <CallScreen
            callType={activeIncomingCall.callType}
            currentUserId={session.user.id || session.user._id}
            otherUser={{
              id: activeIncomingCall.from,
              first_name: activeIncomingCall.callerName.split(' ')[0],
              last_name: activeIncomingCall.callerName.split(' ').slice(1).join(' '),
              avatar_url: activeIncomingCall.callerAvatar,
            }}
            incomingOffer={activeIncomingCall.offer}
            onClose={() => setActiveIncomingCall(null)}
          />
        )}
      </WalletContextProvider>
    </GoogleOAuthProvider>
  )
}