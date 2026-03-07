import { useState, useEffect, useRef } from 'react'
import RightSidebar from './RightSidebar'
import { useAlert } from '../hooks/useAlert'
import { fetchMatchingProfiles, type UserProfile } from '../utils/matchingAlgorithm'
import { likeProfile } from '../utils/likesHandler'
import Stories from './Stories'
import { safeLocalStorageSet } from '../utils/storageUtils'

// Cache matching profiles to prevent constant re-fetching
let cachedProfiles: UserProfile[] | null = null

// Calculate age from date of birth
function calculateAge(dateOfBirth: string): number {
  if (!dateOfBirth) return 0
  const today = new Date()
  const birth = new Date(dateOfBirth)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export default function Home({ session }: any) {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    if (cachedProfiles) return cachedProfiles;
    const stored = localStorage.getItem('cached_matching_profiles');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        cachedProfiles = parsed;
        return parsed;
      } catch (e) { }
    }
    return [];
  })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(() => !cachedProfiles || cachedProfiles.length === 0)
  const [liking, setLiking] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [videoReady, setVideoReady] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { showAlert } = useAlert()

  // Reset video states when changing users
  useEffect(() => {
    if (users[currentIndex]) {
      console.log(`[Home] Current User: ${users[currentIndex].firstName}, Video: ${users[currentIndex].videoUrl ? 'YES' : 'NO'}`);
      if (users[currentIndex].videoUrl) {
        console.log(`[Home] Video URL for ${users[currentIndex].firstName}:`, users[currentIndex].videoUrl);
      }
    }
    setVideoReady(false)
    setVideoError(false)
  }, [currentIndex, users])

  // Simple load timeout for videos (fallback to photo if it hangs)
  useEffect(() => {
    if (users[currentIndex]?.videoUrl && !videoReady && !videoError) {
      console.log(`[Home] Loading video for ${users[currentIndex].firstName}...`);
      const timeout = setTimeout(() => {
        if (!videoReady) {
          console.warn(`[Home] Video load timeout for ${users[currentIndex].firstName} - falling back to photo`);
          setVideoError(true);
        }
      }, 15000); // 15 second grace period
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, videoReady, videoError, users])

  // Explicit play trigger
  useEffect(() => {
    if (videoRef.current && users[currentIndex]?.videoUrl && videoReady) {
      console.log('Video ready, triggering play()');
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error: any) => {
          console.warn('Autoplay prevented - will try again on mute toggle:', error);
        });
      }
    }
  }, [currentIndex, videoReady, users])

  useEffect(() => {
    if (users.length === 0) {
      fetchUsers()
    } else {
      fetchUsers(true) // Silent background refresh
    }
  }, [])

  async function fetchUsers(isSilent = false) {
    if (!isSilent) setLoading(true)
    try {
      const matchingProfiles = await fetchMatchingProfiles(session.token)
      console.log(`[Home] Fetched ${matchingProfiles?.length || 0} profiles`);
      if (matchingProfiles && matchingProfiles.length > 0) {
        console.log('[Home] First profile sample:', {
          name: matchingProfiles[0].firstName,
          hasVideo: !!matchingProfiles[0].videoUrl,
          videoUrl: matchingProfiles[0].videoUrl
        });
        setUsers(matchingProfiles)
        cachedProfiles = matchingProfiles
        safeLocalStorageSet('cached_matching_profiles', matchingProfiles, 50);
      } else {
        console.warn('[Home] No matching profiles returned');
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      if (!isSilent) setLoading(false)
    }
  }

  async function handleLike() {
    if (!users[currentIndex] || liking) return

    setLiking(true)
    try {
      const targetUser = users[currentIndex]
      const result = await likeProfile(session.token, targetUser.id)

      if (result.isMatch) {
        showAlert(`It's a Match! You and ${targetUser.firstName} liked each other.`, 'success')
      }

      if (currentIndex < users.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else {
        fetchUsers()
        setCurrentIndex(0)
      }
    } catch (error) {
      showAlert('Failed to like profile', 'error')
    } finally {
      setLiking(false)
    }
  }

  function handlePass() {
    if (currentIndex < users.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      fetchUsers()
      setCurrentIndex(0)
    }
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Main Matching Area */}
      <main className="flex-1 flex flex-col items-center justify-start lg:justify-center p-4 pb-36 lg:pb-8 relative overflow-y-auto">
        {/* Mobile Stories Section */}
        <div className="lg:hidden w-full bg-[#090a1e]/50 backdrop-blur-md border-b border-white/5 pt-20 pb-4 mb-4">
          <Stories layout="mobile" />
        </div>

        {loading && users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium animate-pulse">Finding your frequency...</p>
          </div>
        ) : users.length > 0 && currentIndex < users.length ? (
          <div className="w-full max-w-[min(94vw,400px)] bg-[#0d0e24] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 relative group transition-all duration-300 sm:max-h-[780px] flex flex-col mb-8">
            <div className="aspect-[3/4.5] sm:aspect-[3/4.2] relative overflow-hidden bg-black flex items-center justify-center min-h-[450px] sm:min-h-0 sm:flex-1">
              {users[currentIndex].videoUrl && !videoError ? (
                <>
                  {!videoReady && !videoError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {!videoReady && !videoError && (
                    <button
                      onClick={() => setVideoError(true)}
                      className="absolute bottom-4 right-4 z-10 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white text-[10px] font-black tracking-widest px-3 py-2 rounded-full border border-white/15 transition-all active:scale-95"
                      title="Skip video"
                    >
                      SKIP VIDEO
                    </button>
                  )}
                  <video
                    ref={videoRef}
                    key={users[currentIndex].id}
                    src={users[currentIndex].videoUrl}
                    className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
                    autoPlay
                    muted={isMuted}
                    loop
                    playsInline
                    preload="auto"
                    onLoadedData={() => {
                      console.log('Video loaded data for:', users[currentIndex].firstName);
                      setVideoReady(true);
                    }}
                    onError={(e) => {
                      console.error('Video error for user:', users[currentIndex].firstName, e);
                      setVideoError(true);
                    }}
                  />
                  <button
                    onClick={() => setIsMuted(prev => !prev)}
                    className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 transition-all hover:bg-black/70 active:scale-90"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0017.73 18l2 2L21 18.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z" />
                      </svg>
                    )}
                  </button>
                </>
              ) : (
                <img
                  src={users[currentIndex].avatarUrl || '/placeholder-avatar.png'}
                  alt={users[currentIndex].firstName}
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                  {users[currentIndex].firstName}, {calculateAge(users[currentIndex].dateOfBirth)}
                  {users[currentIndex].isOnline && (
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0d0e24] shadow-lg animate-pulse" title="Online" />
                  )}
                </h2>
                <p className="text-gray-300 text-sm sm:text-base font-medium">{users[currentIndex].city}</p>
              </div>
            </div>

            <div className="p-6 sm:p-8 flex items-center justify-center gap-8">
              <button
                onClick={handlePass}
                className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-90 shadow-lg"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                onClick={handleLike}
                disabled={liking}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-purple-500/20 hover:scale-110 transition-all active:scale-90 disabled:opacity-50 overflow-hidden p-2.5"
              >
                <img
                  src="/matchlogo.png"
                  alt="Like"
                  className="w-full h-full object-contain brightness-0 invert"
                />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 px-4">
            <h3 className="text-white text-2xl font-bold mb-4">No more profiles</h3>
            <p className="text-gray-500">Check back later for new matches!</p>
          </div>
        )}

        {/* Mobile Matches/Received Section */}
        <div className="lg:hidden w-full max-w-md mt-4 pb-20">
          <h3 className="text-white font-bold text-lg mb-4 px-2">Connections</h3>
          <RightSidebar session={session} mobileView={true} />
        </div>
      </main>

      {/* Right Sidebar stays where it was for Desktop */}
      <aside className="hidden lg:block w-80 min-h-screen p-4 sticky top-0 overflow-y-auto">
        <RightSidebar session={session} />
      </aside>

      {/* Hidden Video Preloader for the NEXT user */}
      {users[currentIndex + 1]?.videoUrl && (
        <div className="hidden" aria-hidden="true">
          <video
            key={`preload-${users[currentIndex + 1].id}`}
            src={users[currentIndex + 1].videoUrl}
            preload="auto"
            muted
            playsInline
          />
        </div>
      )}
    </div>
  )
}
