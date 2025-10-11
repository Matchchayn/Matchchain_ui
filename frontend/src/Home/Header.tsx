import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../client'

interface HeaderProps {
  userId?: string
}

export default function Header({ userId }: HeaderProps) {
  const navigate = useNavigate()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      fetchUserAvatar()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const fetchUserAvatar = async () => {
    try {
      const { data, error } = await supabase
        .from('Profile')
        .select('avatar_url')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (data?.avatar_url) {
        // Download the image from storage (same as Avatar component)
        const { data: imageData, error: downloadError } = await supabase.storage
          .from('avatars')
          .download(data.avatar_url)

        if (downloadError) {
          console.error('Error downloading avatar:', downloadError)
          return
        }

        // Create a blob URL
        const url = URL.createObjectURL(imageData)
        setAvatarUrl(url)
      }
    } catch (error) {
      console.error('Error fetching avatar:', error)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a1f] backdrop-blur-md border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <h1 className="text-xl font-bold text-white">MATCHCHAYN</h1>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-3">
            {/* SOL Balance - All screens */}
            <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#1a1a2e] rounded-full border border-purple-500/30">
              <span className="text-white text-xs sm:text-sm font-semibold">SOL</span>
              <span className="text-purple-400 text-xs sm:text-sm font-bold">24.5</span>
            </div>
            {/* Profile Picture */}
            <button
              onClick={() => navigate('/settings')}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-purple-500 cursor-pointer hover:border-purple-400 transition-colors"
            >
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
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
