import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import type { Session } from '@supabase/supabase-js'
import Header from './Header'
import Sidebar from '../components/Sidebar'
import RightSidebar from './RightSidebar'
import { fetchMatchingProfiles, type UserProfile } from '../utils/matchingAlgorithm'
import { likeProfile } from '../utils/likesHandler'

interface HomeProps {
  session: Session
}

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

export default function Home({ session }: HomeProps) {
  const navigate = useNavigate()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [liking, setLiking] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const hasFetchedProfiles = useRef(false)

  useEffect(() => {
    // Use cached profiles if available, otherwise fetch
    if (cachedProfiles && cachedProfiles.length > 0 && !hasFetchedProfiles.current) {
      setUsers(cachedProfiles)
      setLoading(false)
      hasFetchedProfiles.current = true
    } else if (!hasFetchedProfiles.current) {
      fetchUsers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      const matchingProfiles = await fetchMatchingProfiles(session.user.id)
      setUsers(matchingProfiles)

      // Cache the profiles
      cachedProfiles = matchingProfiles
      hasFetchedProfiles.current = true
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
      setIsVideoPlaying(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsVideoPlaying(false)
    }
  }

  const handleVideoPlayPause = () => {
    const video = document.getElementById(`video-${users[currentIndex]?.id}`) as HTMLVideoElement
    if (video) {
      if (video.paused) {
        video.play()
        setIsVideoPlaying(true)
      } else {
        video.pause()
        setIsVideoPlaying(false)
      }
    }
  }

  if (loading) {
    return (
      <>
        <Sidebar />
        <Header userId={session.user.id} />
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a1f] via-[#1a1a2e] to-[#16213e] flex items-center justify-center pt-16 lg:pl-64">
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
        <Sidebar />
        <Header userId={session.user.id} />

        {/* Desktop Layout with Sidebars */}
        <div className="min-h-screen bg-[#0a0a1f] pt-16 lg:pt-20 pb-20 lg:pb-6 lg:pl-64">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-8 pb-6 sm:pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

              {/* Center - No Matches Message */}
              <div className="flex items-center justify-center min-h-[600px]">
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

              {/* Right Sidebar */}
              <aside className="hidden lg:block">
                <RightSidebar userId={session.user.id} />
              </aside>

            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a1f]/95 backdrop-blur-md border-t border-purple-500/20 z-50">
          <div className="flex items-center justify-around px-2 py-2">
            <button
              onClick={() => navigate('/')}
              className="flex flex-col items-center gap-1 text-purple-400 p-2"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span className="text-[10px] font-medium">Match</span>
            </button>
            <button
              onClick={() => navigate('/matches')}
              className="flex flex-col items-center gap-1 text-white/60 p-2"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span className="text-[10px] font-medium">Matches</span>
            </button>
            <button
              onClick={() => {}}
              className="flex flex-col items-center gap-1 text-white/60 p-2"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
              <span className="text-[10px] font-medium">Messages</span>
            </button>
            <button
              onClick={() => {}}
              className="flex flex-col items-center gap-1 text-white/60 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[10px] font-medium">Events</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="flex flex-col items-center gap-1 text-white/60 p-2"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span className="text-[10px] font-medium">Profile</span>
            </button>
          </div>
        </nav>
      </>
    )
  }

  const currentUser = users[currentIndex]

  return (
    <>
      <Sidebar />
      <Header userId={session.user.id} />

      {/* Desktop Layout: Two Column Grid with Fixed Sidebar */}
      <div className="min-h-screen bg-[#0a0a1f] pt-16 lg:pt-20 pb-20 lg:pb-6 lg:pl-64">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-8 pb-6 sm:pb-10">

          {/* Mobile: RightSidebar at top (Stories and Ads only) */}
          <div className="lg:hidden mb-4">
            <RightSidebar userId={session.user.id} mobileView={true} />
          </div>

          {/* Two Column Grid for Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

            {/* Main Profile Card Area (Center) */}
            <div className="w-full flex items-center justify-center">
              <div className="w-full max-w-[460px]">

                {/* Card Container with Purple Border */}
                <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 p-[3px] rounded-3xl shadow-2xl">
                  <div className="relative bg-[#0a0a1f] rounded-3xl overflow-hidden">

                    {/* Image/Video Section */}
                    {currentUser.photoUrl ? (
                      <div className="relative h-[400px] sm:h-[450px] overflow-hidden">
                        {currentUser.mediaType === 'video' ? (
                          <video
                            id={`video-${currentUser.id}`}
                            src={currentUser.photoUrl}
                            className="w-full h-full object-cover"
                            loop
                            playsInline
                            preload="metadata"
                            controls={false}
                          >
                            <source src={currentUser.photoUrl} type="video/mp4" />
                            <source src={currentUser.photoUrl} type="video/quicktime" />
                            <source src={currentUser.photoUrl} type="video/webm" />
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <img
                            src={currentUser.photoUrl}
                            alt={currentUser.first_name}
                            className="w-full h-full object-cover"
                          />
                        )}

                        {/* Play Button Overlay (center of image) - Only show when video is paused */}
                        {currentUser.mediaType === 'video' && !isVideoPlaying && (
                          <div className="absolute top-0 left-0 right-0 bottom-24 flex items-center justify-center pointer-events-none">
                            <button
                              onClick={handleVideoPlayPause}
                              className="pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/50 flex items-center justify-center hover:bg-white/30 hover:scale-110 transition-all group"
                            >
                              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </button>
                          </div>
                        )}

                        {/* Clickable overlay to pause video when playing - exclude bottom area with buttons */}
                        {currentUser.mediaType === 'video' && isVideoPlaying && (
                          <button
                            onClick={handleVideoPlayPause}
                            className="absolute top-0 left-0 right-0 bottom-24 cursor-pointer"
                            aria-label="Pause video"
                          />
                        )}

                        {/* Navigation Arrows */}
                        <button
                          onClick={handlePrevious}
                          disabled={currentIndex === 0}
                          className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center z-20 ${
                            currentIndex === 0
                              ? 'opacity-30 cursor-not-allowed'
                              : 'hover:scale-110 hover:bg-white'
                          } transition-all`}
                        >
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={handleNext}
                          disabled={currentIndex === users.length - 1}
                          className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center z-20 ${
                            currentIndex === users.length - 1
                              ? 'opacity-30 cursor-not-allowed'
                              : 'hover:scale-110 hover:bg-white'
                          } transition-all`}
                        >
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        {/* Action Buttons - Positioned at bottom of image with higher z-index */}
                        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4 z-20">
                          {/* Pass Button */}
                          <button
                            onClick={handlePass}
                            className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                          >
                            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>

                          {/* Like Button */}
                          <button
                            onClick={handleLike}
                            disabled={liking}
                            className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform disabled:opacity-50"
                          >
                            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-[400px] sm:h-[450px] bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center rounded-t-3xl">
                        <div className="text-center">
                          <svg className="w-20 h-20 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <p className="text-gray-500 font-medium text-lg">No Photo</p>
                        </div>

                        {/* Navigation Arrows for No Photo state */}
                        <button
                          onClick={handlePrevious}
                          disabled={currentIndex === 0}
                          className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center z-20 ${
                            currentIndex === 0
                              ? 'opacity-30 cursor-not-allowed'
                              : 'hover:scale-110 hover:bg-white'
                          } transition-all`}
                        >
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={handleNext}
                          disabled={currentIndex === users.length - 1}
                          className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center z-20 ${
                            currentIndex === users.length - 1
                              ? 'opacity-30 cursor-not-allowed'
                              : 'hover:scale-110 hover:bg-white'
                          } transition-all`}
                        >
                          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Profile Info Section - Below Image */}
                    <div className="bg-[#1a0a2e] p-6 rounded-b-3xl">
                      {/* Name and Location */}
                      <div className="flex items-center gap-2 mb-3">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">
                          {currentUser.first_name}, {calculateAge(currentUser.dateofbirth)}
                        </h2>
                        <svg className="w-6 h-6 text-purple-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                        </svg>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-gray-300 mb-4">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        <span className="text-sm font-medium">
                          {currentUser.city}, {currentUser.distance} km from you
                        </span>
                      </div>

                      {/* Bio */}
                      {currentUser.bio && (
                        <p className="text-gray-300 text-base mb-5 leading-relaxed">
                          {currentUser.bio}
                        </p>
                      )}

                      {/* Interest Tags */}
                      {currentUser.interests.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {currentUser.interests.slice(0, 5).map((interest, idx) => (
                            <span
                              key={idx}
                              className="px-4 py-2 bg-white text-gray-900 text-sm font-medium rounded-full"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* Counter */}
                <div className="text-center mt-6">
                  <p className="text-white/60 text-sm font-medium">
                    {currentIndex + 1} of {users.length} profiles
                  </p>
                </div>

              </div>
            </div>

            {/* Right Sidebar - Stories, Banner, and Matches */}
            <aside className="hidden lg:block">
              <RightSidebar userId={session.user.id} />
            </aside>

          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a1f]/95 backdrop-blur-md border-t border-purple-500/20 z-50">
        <div className="flex items-center justify-around px-2 py-2">
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center gap-1 text-purple-400 p-2"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span className="text-[10px] font-medium">Match</span>
          </button>
          <button
            onClick={() => navigate('/likes')}
            className="flex flex-col items-center gap-1 text-white/60 p-2"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span className="text-[10px] font-medium">Likes</span>
          </button>
          <button
            onClick={() => {}}
            className="flex flex-col items-center gap-1 text-white/60 p-2"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
            <span className="text-[10px] font-medium">Messages</span>
          </button>
          <button
            onClick={() => {}}
            className="flex flex-col items-center gap-1 text-white/60 p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] font-medium">Events</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex flex-col items-center gap-1 text-white/60 p-2"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </>
  )
}
