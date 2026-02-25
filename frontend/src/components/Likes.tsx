import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../Home/Header'
import Sidebar from './Sidebar'
import TopLoader from './Common/TopLoader'
import { fetchLikedProfiles } from '../utils/likesHandler'
import Stories from '../Home/Stories'
import MobileBottomNav from './MobileBottomNav'

interface LikesProps {
  session: any
}

// Module-level cache
let cachedLikedProfiles: any[] | null = null

export default function Likes({ session }: LikesProps) {
  const navigate = useNavigate()
  const [likedProfiles, setLikedProfiles] = useState<any[]>(cachedLikedProfiles || [])
  const [loading, setLoading] = useState(!cachedLikedProfiles)

  useEffect(() => {
    loadLikedProfiles(cachedLikedProfiles ? true : false)
  }, [])

  async function loadLikedProfiles(isSilent = false) {
    try {
      if (!isSilent) setLoading(true)
      const profiles = await fetchLikedProfiles(session.token)
      setLikedProfiles(profiles)
      cachedLikedProfiles = profiles
    } catch (error) {
      console.error('Error loading liked profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Sidebar />
        <Header userId={session.user.id || session.user._id} />
        <TopLoader message="Loading your likes..." />
        <div className="min-h-screen bg-[#0a0a1f] pt-16 lg:pl-64" />
      </>
    )
  }

  return (
    <>
      <Sidebar />
      <Header userId={session.user.id || session.user._id} />

      <div className="min-h-screen bg-[#0a0a1f] pt-16 pb-28 lg:pb-8 lg:pl-64">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">

          {/* Stories section - below header */}
          <div className="w-full bg-[#090a1e]/50 backdrop-blur-md border-b border-white/5 mb-8">
            <Stories layout="mobile" />
          </div>

          {/* Header - Desktop Only */}
          <div className="hidden lg:flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">People You Liked</h1>
            </div>
            <p className="text-gray-400 text-sm">{likedProfiles.length} {likedProfiles.length === 1 ? 'profile' : 'profiles'}</p>
          </div>

          {/* Liked Profiles Grid */}
          {likedProfiles.length === 0 ? (
            <div className="text-center py-12 sm:py-20 px-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">No likes yet</h2>
              <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6">Start liking profiles to see them here!</p>
              <button
                onClick={() => navigate('/')}
                className="px-5 sm:px-6 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm sm:text-base font-medium rounded-full transition-colors"
              >
                Start Exploring
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              {likedProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-[#1a1a2e] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group"
                >
                  {/* Profile Image */}
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {profile.avatarUrl ? (
                      <>
                        <img
                          src={profile.avatarUrl}
                          alt={profile.firstName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        <svg className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}

                    {/* Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                      <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5">
                        <h3 className="text-white text-sm sm:text-base lg:text-lg font-bold truncate">
                          {profile.firstName}
                        </h3>
                      </div>
                      <p className="text-white/80 text-[10px] sm:text-xs flex items-center gap-0.5 sm:gap-1 truncate">
                        <span className="truncate">{profile.city}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <MobileBottomNav />
    </>
  )
}
