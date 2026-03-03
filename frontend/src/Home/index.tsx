
import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from '../components/Sidebar'
import RightSidebar from './RightSidebar'
import MobileBottomNav from '../components/MobileBottomNav'
import { useAlert } from '../hooks/useAlert'
import { fetchMatchingProfiles, type UserProfile } from '../utils/matchingAlgorithm'
import { likeProfile } from '../utils/likesHandler'

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

  const [users, setUsers] = useState<UserProfile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [liking, setLiking] = useState(false)
  const [isMuted, setIsMuted] = useState(true)

  useEffect(() => {
    if (cachedProfiles && cachedProfiles.length > 0) {
      setUsers(cachedProfiles)
      setLoading(false)
      fetchUsers(true)
    } else {
      fetchUsers()
    }
  }, [])

  async function fetchUsers(isSilent = false) {
    if (!isSilent) setLoading(true)
    try {
      const matchingProfiles = await fetchMatchingProfiles(session.token)
      setUsers(matchingProfiles)
      cachedProfiles = matchingProfiles
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const { showAlert } = useAlert()

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
    <div className="min-h-screen bg-[#090a1e] flex flex-col">
      <Header />
      <Sidebar />
      <div className="flex-1 lg:pl-64 flex flex-col">
        <div className="flex-1 flex flex-col lg:flex-row pt-20">
          <main className="flex-1 flex flex-col items-center justify-center p-4">
            {/* Removed stories from here to place below header */}

            {loading ? (
              <div className="w-full max-w-md bg-[#0d0e24] rounded-[2rem] overflow-hidden shadow-2xl border border-white/5 animate-pulse">
                <div className="aspect-[3/4] bg-white/5 relative">
                  <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4">
                    <div className="h-8 bg-white/10 rounded-lg w-2/3"></div>
                    <div className="h-4 bg-white/5 rounded-lg w-1/3"></div>
                  </div>
                </div>
                <div className="p-8 flex justify-center gap-8">
                  <div className="w-16 h-16 rounded-full bg-white/5"></div>
                  <div className="w-16 h-16 rounded-full bg-white/10"></div>
                </div>
              </div>
            ) : users.length > 0 && currentIndex < users.length ? (
              <div className="w-full max-w-md bg-[#0d0e24] rounded-[2rem] overflow-hidden shadow-2xl border border-white/5 relative group">
                <div className="aspect-[3/4] relative overflow-hidden bg-black">
                  {users[currentIndex].videoUrl ? (
                    <>
                      <video
                        key={users[currentIndex].id}
                        src={users[currentIndex].videoUrl}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted={isMuted}
                        loop
                        playsInline
                      />
                      {/* Mute/Unmute Button */}
                      <button
                        onClick={() => setIsMuted(prev => !prev)}
                        className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 transition-all hover:bg-black/70 active:scale-90"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? (
                          // Muted icon
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0017.73 18l2 2L21 18.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                          </svg>
                        ) : (
                          // Unmuted icon
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
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <h2 className="text-3xl font-bold text-white">
                      {users[currentIndex].firstName}, {calculateAge(users[currentIndex].dateOfBirth)}
                    </h2>
                    <p className="text-gray-300 font-medium">{users[currentIndex].city}</p>
                  </div>
                </div>

                <div className="p-8 flex items-center justify-center gap-8">
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
          </main>

          {/* Right Sidebar stays where it was for Desktop */}
          <aside className="hidden lg:block w-80 min-h-[calc(100vh-6rem)] p-4">
            <RightSidebar session={session} />
          </aside>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  )
}
