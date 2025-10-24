import { useState, useEffect } from 'react'
import { supabase } from '../client'

interface Match {
  id: string
  name: string
  avatar: string
  message: string
  time: string
}

interface Story {
  id: string
  name: string
  avatar: string | null
  isCreate?: boolean
}

interface RightSidebarProps {
  userId: string
  mobileView?: boolean
}

export default function RightSidebar({ userId, mobileView = false }: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<'matches' | 'likes'>('matches')
  const [stories] = useState<Story[]>([
    { id: 'create', name: 'Create', avatar: null, isCreate: true }
  ])
  const [matches, setMatches] = useState<Match[]>([])
  const [likes, setLikes] = useState<Match[]>([])
  const [matchCount, setMatchCount] = useState(0)
  const [likeCount, setLikeCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      fetchLikes()
      fetchMatches()

      // Set up polling to check for new likes every 10 seconds
      const interval = setInterval(() => {
        fetchLikes()
        fetchMatches()
      }, 10000)

      return () => clearInterval(interval)
    }
  }, [userId])

  const fetchLikes = async () => {
    try {
      // Fetch users who liked the current user
      const { data: likesData, error: likesError } = await supabase
        .from('user_likes')
        .select('user_id, created_at')
        .eq('liked_user_id', userId)
        .order('created_at', { ascending: false })

      if (likesError) throw likesError

      if (likesData && likesData.length > 0) {
        // Fetch profile details for each liker
        const likerIds = likesData.map(like => like.user_id)
        const { data: profiles, error: profilesError } = await supabase
          .from('Profile')
          .select('id, first_name, last_name, avatar_url')
          .in('id', likerIds)

        if (profilesError) throw profilesError

        // Combine likes with profile data
        const likesWithProfiles = likesData.map(like => {
          const profile = profiles?.find(p => p.id === like.user_id)
          const createdAt = new Date(like.created_at)
          const timeStr = createdAt.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })

          return {
            id: like.user_id,
            name: profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Unknown',
            avatar: profile?.avatar_url || '',
            message: 'Sent a Match request',
            time: timeStr
          }
        })

        setLikes(likesWithProfiles)
        setLikeCount(likesWithProfiles.length)
      } else {
        // No likes found, reset state
        setLikes([])
        setLikeCount(0)
      }
    } catch (error) {
      console.error('Error fetching likes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMatches = async () => {
    try {
      // Fetch mutual likes (matches)
      const { data: myLikes, error: myLikesError } = await supabase
        .from('user_likes')
        .select('liked_user_id')
        .eq('user_id', userId)

      if (myLikesError) throw myLikesError

      const { data: theirLikes, error: theirLikesError } = await supabase
        .from('user_likes')
        .select('user_id, created_at')
        .eq('liked_user_id', userId)

      if (theirLikesError) throw theirLikesError

      // Find mutual likes
      const myLikedIds = myLikes?.map(like => like.liked_user_id) || []
      const mutualLikes = theirLikes?.filter(like => myLikedIds.includes(like.user_id)) || []

      if (mutualLikes.length > 0) {
        const matchIds = mutualLikes.map(like => like.user_id)
        const { data: profiles, error: profilesError } = await supabase
          .from('Profile')
          .select('id, first_name, last_name, avatar_url')
          .in('id', matchIds)

        if (profilesError) throw profilesError

        const matchesWithProfiles = mutualLikes.map(like => {
          const profile = profiles?.find(p => p.id === like.user_id)
          const createdAt = new Date(like.created_at)
          const timeStr = createdAt.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })

          return {
            id: like.user_id,
            name: profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Unknown',
            avatar: profile?.avatar_url || '',
            message: "It's a match!",
            time: timeStr
          }
        })

        setMatches(matchesWithProfiles)
        setMatchCount(matchesWithProfiles.length)
      } else {
        // No matches found, reset state
        setMatches([])
        setMatchCount(0)
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
    }
  }

  return (
    <div className="sticky top-24 space-y-4">
      {/* Stories Section */}
      <div className="bg-[#1a1a2e]/50 rounded-xl p-4 border border-purple-500/10 overflow-hidden">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {stories.map((story) => (
            <div
              key={story.id}
              className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
            >
              {story.isCreate ? (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
              ) : (
                <div className="relative w-14 h-14 flex-shrink-0">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-[2px]">
                    <div className="w-full h-full rounded-full bg-[#1a1a2e] p-[2px]">
                      <img
                        src={story.avatar || ''}
                        alt={story.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                  </div>
                </div>
              )}
              <span className="text-white text-[10px] font-medium whitespace-nowrap text-center w-[60px] overflow-hidden text-ellipsis">
                {story.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Promotional Banner */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl p-4 relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-white text-sm font-bold mb-1.5">
            Unlock the Future of Finance
          </h3>
          <p className="text-white/90 text-xs mb-3 leading-snug">
            Join top minds in crypto, blockchain, and Web3 for a day of insight, innovation, and real-world connections.
          </p>
          <button className="w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm">
            Register for event
          </button>
        </div>
        {/* Decorative gift box icon */}
        <div className="absolute bottom-0 right-0 opacity-20">
          <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>
          </svg>
        </div>
      </div>

      {/* Matches / My Likes Section - Hidden on mobile view */}
      {!mobileView && (
      <div className="bg-[#1a1a2e]/50 rounded-xl border border-purple-500/10 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-purple-500/10">
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium text-sm transition-colors relative ${
              activeTab === 'matches'
                ? 'text-purple-400'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span>Matches</span>
            {matchCount > 0 && (
              <span className="bg-purple-600/30 text-purple-400 text-xs px-2 py-0.5 rounded-full font-semibold">
                {matchCount}
              </span>
            )}
            {activeTab === 'matches' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('likes')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium text-sm transition-colors relative ${
              activeTab === 'likes'
                ? 'text-purple-400'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>My likes</span>
            {likeCount > 0 && (
              <span className="bg-purple-600/30 text-purple-400 text-xs px-2 py-0.5 rounded-full font-semibold">
                {likeCount}
              </span>
            )}
            {activeTab === 'likes' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400"></div>
            )}
          </button>
        </div>

        {/* Match/Likes List */}
        <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600/50 scrollbar-track-transparent">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-white/40 text-sm">Loading...</p>
            </div>
          ) : (activeTab === 'matches' ? matches : likes).length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-white/20 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <p className="text-white/40 text-sm">
                {activeTab === 'matches' ? 'No matches yet' : 'No likes yet'}
              </p>
            </div>
          ) : (
            (activeTab === 'matches' ? matches : likes).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-600/10 transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-purple-500/30">
                  {item.avatar ? (
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white font-bold">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-sm truncate">
                    {item.name}
                  </h4>
                  <p className="text-white/50 text-xs truncate">{item.message}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-white/40 text-[10px]">{item.time}</span>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-full font-medium transition-colors">
                    View profile
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      )}
    </div>
  )
}
