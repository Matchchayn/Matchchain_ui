import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../client'

interface HeaderProps {
  userId?: string
}

// Cache for user data to prevent re-fetching
const userDataCache = new Map<string, { avatarUrl: string | null }>()

export default function Header({ userId }: HeaderProps) {
  const navigate = useNavigate()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (userId && !hasFetched.current) {
      // Check cache first
      const cached = userDataCache.get(userId)
      if (cached) {
        setAvatarUrl(cached.avatarUrl)
        hasFetched.current = true
      } else {
        fetchUserAvatar()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const fetchUserAvatar = async () => {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from('Profile')
        .select('avatar_url')
        .eq('id', userId)
        .single()

      if (error) throw error

      const url = data?.avatar_url || null
      setAvatarUrl(url)

      // Cache the result
      userDataCache.set(userId, { avatarUrl: url })
      hasFetched.current = true
    } catch (error) {
      console.error('Error fetching avatar:', error)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a1f] backdrop-blur-md border-b border-purple-500/20">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <h1 className="text-lg sm:text-xl font-bold text-white">MatchChayn</h1>
          </div>

          {/* Center - Explore Matches (hidden on mobile) */}
          <div className="hidden lg:block text-white/80 font-medium">
            Explore Matches
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Connect Wallet Button (desktop) */}
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-white text-sm font-medium">Connect wallet</span>
            </button>

            {/* Notification Bell */}
            <button className="hidden sm:block relative p-2 hover:bg-purple-600/20 rounded-lg transition-colors">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* SOL Balance */}
            <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#1a1a2e] rounded-full border border-purple-500/30">
              <span className="text-white text-xs sm:text-sm font-semibold">SOL</span>
              <span className="text-purple-400 text-xs sm:text-sm font-bold">24.5</span>
            </div>

            {/* Profile Picture with dropdown indicator */}
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-1 sm:gap-2 hover:bg-purple-600/20 rounded-full pr-2 sm:pr-3 transition-colors"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-purple-500">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {userId?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <svg className="hidden sm:block w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
