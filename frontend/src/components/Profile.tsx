import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../Home/Header'
import Sidebar from './Sidebar'

interface UserData {
  _id: string
  email: string
  firstName: string
  lastName: string
  username: string
  gender: string
  dateOfBirth: string
  city: string
  country: string
  relationshipStatus: string
  bio: string
  avatarUrl: string
  secondaryPhotoUrl: string
  thirdPhotoUrl: string
  videoUrl: string
  interests: string[]
  onboardingStatus: string
  preferences: {
    lookingForGender: string
    lookingForRelationshipStatus: string
    distanceKm: number
    ageMin: number
    ageMax: number
    heightMinCm: number
    heightMaxCm: number
  }
  createdAt: string
}

interface ProfileProps {
  session: any
}

import { fetchUserProfile, clearProfileCache } from '../utils/userProfileService'

export default function Profile({ session }: ProfileProps) {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Always clear cache so we get the freshest signed video URL from the backend
    clearProfileCache()
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = session?.token || localStorage.getItem('token')
      // Force refresh to always get a fresh signed video URL from backend
      const data = await fetchUserProfile(token || '', true)
      if (data) {
        setUser(data)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (dob: string) => {
    if (!dob) return null
    const today = new Date()
    const birth = new Date(dob)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    })
  }

  const userId = session?.user?.id || session?.user?._id || ''

  return (
    <>
      <Sidebar />
      <Header userId={userId} isLoading={loading} />

      <div className="min-h-screen bg-[#0a0a1f] text-white lg:pl-64">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4" style={{ paddingTop: '70px' }}>
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/')} className="text-white hover:text-gray-300 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold">My Profile</h1>
            </div>
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-sm font-medium rounded-full transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </button>
          </div>

          {user && (
            <>
              {/* Profile Header Card */}
              <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-purple-500/10">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="Profile"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-purple-500"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-purple-600/20 flex items-center justify-center border-2 border-purple-500/20">
                        <svg className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Name & Location */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold truncate">
                      {user.firstName} {user.lastName}
                      {user.dateOfBirth && (
                        <span className="text-purple-400 text-lg font-normal ml-2">{calculateAge(user.dateOfBirth)}</span>
                      )}
                    </h2>
                    {user.username && (
                      <p className="text-purple-400 text-sm font-medium">@{user.username}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1 text-gray-400 text-sm">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                      <span className="truncate">
                        {[user.city, user.country].filter(Boolean).join(', ') || 'No location set'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {user.gender && (
                        <span className="px-2.5 py-1 bg-purple-600/20 text-purple-300 text-xs font-medium rounded-full capitalize">
                          {user.gender}
                        </span>
                      )}
                      {user.relationshipStatus && (
                        <span className="px-2.5 py-1 bg-pink-600/20 text-pink-300 text-xs font-medium rounded-full capitalize">
                          {user.relationshipStatus.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="bg-[#1a1a2e] rounded-2xl p-5 sm:p-6 border border-purple-500/10">
                <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wider mb-3">About Me</h3>
                <p className="text-gray-200 text-sm leading-relaxed">
                  {user.bio || 'No bio added yet.'}
                </p>
              </div>

              {/* Personal Info */}
              <div className="bg-[#1a1a2e] rounded-2xl p-5 sm:p-6 border border-purple-500/10">
                <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wider mb-4">Personal Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Email</p>
                    <p className="text-white text-sm font-medium truncate">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Date of Birth</p>
                    <p className="text-white text-sm font-medium">{formatDate(user.dateOfBirth)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Gender</p>
                    <p className="text-white text-sm font-medium capitalize">{user.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Relationship</p>
                    <p className="text-white text-sm font-medium capitalize">{user.relationshipStatus?.replace('_', ' ') || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Location</p>
                    <p className="text-white text-sm font-medium">{[user.city, user.country].filter(Boolean).join(', ') || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Joined</p>
                    <p className="text-white text-sm font-medium">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Interests */}
              <div className="bg-[#1a1a2e] rounded-2xl p-5 sm:p-6 border border-purple-500/10">
                <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wider mb-4">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {user.interests && user.interests.length > 0 ? (
                    user.interests.map((interest, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-purple-600/20 text-purple-300 rounded-full text-sm font-medium">
                        {interest}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No interests added</p>
                  )}
                </div>
              </div>

              {/* Preferences */}
              {user.preferences && (
                <div className="bg-[#1a1a2e] rounded-2xl p-5 sm:p-6 border border-purple-500/10">
                  <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wider mb-4">Match Preferences</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Looking For</p>
                      <p className="text-white text-sm font-medium capitalize">{user.preferences.lookingForGender || 'Anyone'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Relationship Type</p>
                      <p className="text-white text-sm font-medium capitalize">{user.preferences.lookingForRelationshipStatus?.replace('_', ' ') || 'Any'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Distance</p>
                      <p className="text-white text-sm font-medium">{user.preferences.distanceKm || 50} km</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Age Range</p>
                      <p className="text-white text-sm font-medium">{user.preferences.ageMin || 18} – {user.preferences.ageMax || 40} years</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Media Gallery */}
              <div className="bg-[#1a1a2e] rounded-2xl p-5 sm:p-6 border border-purple-500/10">
                <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wider mb-4">Media</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {user.avatarUrl && (
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-800">
                      <img src={user.avatarUrl} alt="Profile Photo" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {user.secondaryPhotoUrl && (
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-800">
                      <img src={user.secondaryPhotoUrl} alt="Secondary Photo" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {user.thirdPhotoUrl && (
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-800">
                      <img src={user.thirdPhotoUrl} alt="Third Photo" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {user.videoUrl && (
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-800">
                      <video src={user.videoUrl} className="w-full h-full object-cover" controls preload="metadata" />
                    </div>
                  )}
                  {!user.avatarUrl && !user.secondaryPhotoUrl && !user.thirdPhotoUrl && !user.videoUrl && (
                    <div className="col-span-full text-center py-8">
                      <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-500 text-sm">No media uploaded yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-[#1a1a2e] rounded-2xl p-5 sm:p-6 border border-purple-500/10">
                <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wider mb-4">Account Status</h3>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${user.onboardingStatus === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-white text-sm font-medium capitalize">
                    {user.onboardingStatus === 'completed' ? 'Profile Complete' : user.onboardingStatus?.replace('_', ' ') || 'Getting Started'}
                  </span>
                </div>
              </div>
            </>
          )}

          {!loading && !user && (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">Could not load profile data.</p>
              <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-full text-sm">
                Go Home
              </button>
            </div>
          )}
          {!user && !loading && (
            <div className="flex flex-col items-center justify-center p-12 text-center text-white/50 bg-[#1a1a2e] rounded-xl border border-red-500/20">
              <svg className="w-12 h-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-xl font-bold mb-2 text-white">Couldn't load profile</h3>
              <p>Please double-check your connection and try refreshing the app.</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-full font-medium transition-colors text-white"
              >
                Refresh App
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
