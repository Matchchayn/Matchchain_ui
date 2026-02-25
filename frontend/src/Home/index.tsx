
import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from '../components/Sidebar'
import RightSidebar from './RightSidebar'
import MobileBottomNav from '../components/MobileBottomNav'
import Stories from './Stories'
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
        {/* Status section - below header */}
        <div className="w-full bg-[#090a1e]/50 backdrop-blur-md border-b border-white/5 pt-20 pb-2">
          <Stories layout="mobile" />
        </div>

        <div className="flex-1 flex flex-col lg:flex-row">
          <main className="flex-1 flex flex-col items-center justify-center p-4">
            {/* Removed stories from here to place below header */}

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : users.length > 0 && currentIndex < users.length ? (
              <div className="w-full max-w-md bg-[#0d0e24] rounded-[2rem] overflow-hidden shadow-2xl border border-white/5 relative group">
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img
                    src={users[currentIndex].avatarUrl || '/placeholder-avatar.png'}
                    alt={users[currentIndex].firstName}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <h2 className="text-3xl font-bold text-white">
                      {users[currentIndex].firstName}, {calculateAge(users[currentIndex].dateOfBirth)}
                    </h2>
                    <p className="text-gray-300 font-medium">{users[currentIndex].city}</p>
                  </div>
                </div>

                <div className="p-8 flex items-center justify-center gap-6">
                  <button
                    onClick={handlePass}
                    className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    onClick={handleLike}
                    disabled={liking}
                    className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-purple-500/20 hover:scale-110 transition-all active:scale-90 disabled:opacity-50"
                  >
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
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
