import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import Header from './Header'
import Stories from './Stories'
import Navigation from './Navigation'
import { fetchMatchingProfiles, type UserProfile } from '../utils/matchingAlgorithm'
import { likeProfile } from '../utils/likesHandler'

interface HomeProps {
  session: Session
}

export default function Home({ session }: HomeProps) {
  const navigate = useNavigate()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [liking, setLiking] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      const matchingProfiles = await fetchMatchingProfiles(session.user.id)
      setUsers(matchingProfiles)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLike() {
    if (liking || !users[currentIndex]) return

    setLiking(true)
    const currentUser = users[currentIndex]

    const result = await likeProfile(session.user.id, currentUser.id)

    if (result.success) {
      if (result.error === "It's a match!") {
        // Show match notification
        alert("🎉 It's a Match! You both liked each other!")
      }
      // Move to next profile
      handleNext()
    } else {
      console.error('Error liking profile:', result.error)
    }

    setLiking(false)
  }

  function handlePass() {
    handleNext()
  }

  const handleNext = () => {
    if (currentIndex < users.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  if (loading) {
    return (
      <>
        <Header userId={session.user.id} />
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a1f] via-[#1a1a2e] to-[#16213e] flex items-center justify-center pt-16">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Finding your perfect matches...</p>
          </div>
        </div>
      </>
    )
  }

  if (users.length === 0) {
    return (
      <>
        <Header userId={session.user.id} />
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a1f] via-[#1a1a2e] to-[#16213e] flex items-center justify-center pt-16">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">No matches yet</h2>
            <p className="text-gray-400 mb-6">Check back later for new profiles to discover!</p>
            <button 
              onClick={() => fetchUsers()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-full transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </>
    )
  }

  const currentUser = users[currentIndex]

  return (
    <>
      <Header userId={session.user.id} />

      {/* Mobile Stories (full width at top) */}
      <div className="lg:hidden pt-16">
        <Stories layout="mobile" />
      </div>

      {/* Desktop Layout: Three Column Grid */}
      <div className="min-h-screen bg-[#0a0a1f] pt-0 lg:pt-20 pb-20 lg:pb-0">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-8 pb-6 sm:pb-10">
          {/* Three Column Grid for Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] xl:grid-cols-[320px_1fr_300px] 2xl:grid-cols-[320px_500px_320px] gap-6 items-start 2xl:justify-center">

            {/* Left Sidebar - Navigation */}
            <aside className="hidden lg:block">
              <Navigation />
            </aside>

            {/* Main Profile Card Area (Center) */}
            <div className="w-full flex items-center justify-center">
              <div className="w-full max-w-md 2xl:max-w-[420px]">
                
                {/* Card Container */}
                <div className="relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl w-full">
                  {/* Photo */}
                  {currentUser.photoUrl ? (
                    <div className="relative">
                      <img
                        src={currentUser.photoUrl}
                        alt={currentUser.first_name}
                        className="w-full h-[450px] sm:h-[500px] md:h-[550px] object-cover"
                      />

                      {/* Play Button Overlay - Only for videos */}
                      {currentUser.mediaType === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/80 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* Location Tag */}
                      <div className="absolute top-3 right-3 sm:top-5 sm:right-5 bg-white/90 px-2.5 py-1 sm:px-4 sm:py-2 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        <span className="text-[11px] sm:text-sm font-medium text-gray-700">
                          {currentUser.city}, {currentUser.distance} km
                        </span>
                      </div>

                      {/* Action Buttons - Inside image, above profile info */}
                      <div className="absolute bottom-[100px] sm:bottom-[115px] left-0 right-0 flex items-center justify-center gap-6 sm:gap-8">
                        {/* Pass Button */}
                        <button
                          onClick={handlePass}
                          className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                        >
                          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>

                        {/* Like Button */}
                        <button
                          onClick={handleLike}
                          disabled={liking}
                          className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-600 rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                        </button>
                      </div>

                      {/* Profile Information - White Background */}
                      <div className="absolute bottom-0 left-3 right-3 sm:left-4 sm:right-4 bg-white px-3 py-2 sm:px-4 sm:py-3 rounded-2xl mb-3 sm:mb-4 shadow-xl">
                        <div className="flex items-center justify-between gap-3">
                          {/* Left: Name and Description */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <h2 className="text-base sm:text-xl font-bold text-gray-900">{currentUser.first_name}</h2>
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                              </svg>
                            </div>
                            {currentUser.bio && (
                              <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                                {currentUser.bio}
                              </p>
                            )}
                          </div>

                          {/* Right: Tags */}
                          {currentUser.interests.length > 0 && (
                            <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                              {currentUser.interests.slice(0, 2).map((interest, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 sm:px-3 sm:py-1 bg-white text-purple-600 text-xs sm:text-sm font-medium rounded-lg border border-purple-200 whitespace-nowrap"
                                >
                                  {interest}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-[450px] sm:h-[500px] md:h-[550px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <p className="text-gray-500 font-medium text-base sm:text-lg">No Photo</p>
                      </div>
                    </div>
                  )}

                  {/* Navigation Arrows */}
                  <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-lg flex items-center justify-center ${
                      currentIndex === 0 
                        ? 'opacity-30 cursor-not-allowed' 
                        : 'cursor-pointer hover:scale-105'
                    } active:scale-95 transition-transform`}
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentIndex === users.length - 1}
                    className={`absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-lg flex items-center justify-center ${
                      currentIndex === users.length - 1 
                        ? 'opacity-30 cursor-not-allowed' 
                        : 'cursor-pointer hover:scale-105'
                    } active:scale-95 transition-transform`}
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Counter */}
                <div className="text-center mt-8 sm:mt-10">
                  <p className="text-white/60 text-sm sm:text-base font-medium">
                    {currentIndex + 1} of {users.length} profiles
                  </p>
                </div>

              </div>
            </div>

            {/* Right Sidebar - Stories and Promotional Banner */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <Stories layout="sidebar" />
                <Stories layout="banner" />
              </div>
            </aside>

          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a1f] border-t border-purple-500/20 z-50">
        <div className="flex items-center justify-around px-4 py-3">
          <button className="flex flex-col items-center gap-1 text-purple-500">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span className="text-xs font-medium">Match</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-white/60">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span className="text-xs font-medium">Likes</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-white/60">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
            <span className="text-xs font-medium">Messages</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex flex-col items-center gap-1 text-white/60"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </>
  )
}
