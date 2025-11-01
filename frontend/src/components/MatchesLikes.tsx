import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../client'
import Header from '../Home/Header'
import Sidebar from './Sidebar'

interface Match {
  id: string
  name: string
  avatar: string
  message: string
  time: string
}

interface MatchesLikesProps {
  session: Session
}

export default function MatchesLikes({ session }: MatchesLikesProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'matches' | 'likes'>('matches')
  const [matches, setMatches] = useState<Match[]>([])
  const [likes, setLikes] = useState<Match[]>([])
  const [matchCount, setMatchCount] = useState(0)
  const [likeCount, setLikeCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLikes()
    fetchMatches()

    // Set up polling to check for new likes every 10 seconds
    const interval = setInterval(() => {
      fetchLikes()
      fetchMatches()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const fetchLikes = async () => {
    try {
      const { data: likesData, error: likesError } = await supabase
        .from('user_likes')
        .select('user_id, created_at')
        .eq('liked_user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (likesError) throw likesError

      if (likesData && likesData.length > 0) {
        const likerIds = likesData.map(like => like.user_id)
        const { data: profiles, error: profilesError } = await supabase
          .from('Profile')
          .select('id, first_name, last_name')
          .in('id', likerIds)

        if (profilesError) throw profilesError

        // Get profile pictures from user_media
        const { data: mediaData } = await supabase
          .from('user_media')
          .select('user_id, media_url')
          .in('user_id', likerIds)
          .eq('display_order', 1)

        const likesWithProfiles = await Promise.all(likesData.map(async like => {
          const profile = profiles?.find(p => p.id === like.user_id)
          const media = mediaData?.find(m => m.user_id === like.user_id)

          let avatarUrl = ''
          if (media?.media_url) {
            const { data: urlData } = await supabase.storage
              .from('user-videos')
              .createSignedUrl(media.media_url, 3600)
            avatarUrl = urlData?.signedUrl || ''
          }

          const createdAt = new Date(like.created_at)
          const timeStr = createdAt.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })

          return {
            id: like.user_id,
            name: profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Unknown',
            avatar: avatarUrl,
            message: 'Sent a Match request',
            time: timeStr
          }
        }))

        setLikes(likesWithProfiles)
        setLikeCount(likesWithProfiles.length)
      } else {
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
      const { data: myLikes, error: myLikesError } = await supabase
        .from('user_likes')
        .select('liked_user_id')
        .eq('user_id', session.user.id)

      if (myLikesError) throw myLikesError

      const { data: theirLikes, error: theirLikesError } = await supabase
        .from('user_likes')
        .select('user_id, created_at')
        .eq('liked_user_id', session.user.id)

      if (theirLikesError) throw theirLikesError

      const myLikedIds = myLikes?.map(like => like.liked_user_id) || []
      const mutualLikes = theirLikes?.filter(like => myLikedIds.includes(like.user_id)) || []

      if (mutualLikes.length > 0) {
        const matchIds = mutualLikes.map(like => like.user_id)
        const { data: profiles, error: profilesError } = await supabase
          .from('Profile')
          .select('id, first_name, last_name')
          .in('id', matchIds)

        if (profilesError) throw profilesError

        // Get profile pictures from user_media
        const { data: mediaData } = await supabase
          .from('user_media')
          .select('user_id, media_url')
          .in('user_id', matchIds)
          .eq('display_order', 1)

        const matchesWithProfiles = await Promise.all(mutualLikes.map(async like => {
          const profile = profiles?.find(p => p.id === like.user_id)
          const media = mediaData?.find(m => m.user_id === like.user_id)

          let avatarUrl = ''
          if (media?.media_url) {
            const { data: urlData } = await supabase.storage
              .from('user-videos')
              .createSignedUrl(media.media_url, 3600)
            avatarUrl = urlData?.signedUrl || ''
          }

          const createdAt = new Date(like.created_at)
          const timeStr = createdAt.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })

          return {
            id: like.user_id,
            name: profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Unknown',
            avatar: avatarUrl,
            message: "It's a match!",
            time: timeStr
          }
        }))

        setMatches(matchesWithProfiles)
        setMatchCount(matchesWithProfiles.length)

        // Auto-create conversations for all matches
        for (const match of matchesWithProfiles) {
          await createOrGetConversation(match.id)
        }
      } else {
        setMatches([])
        setMatchCount(0)
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
    }
  }

  const createOrGetConversation = async (otherUserId: string) => {
    try {
      // Check if conversation already exists (either way around)
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(user1_id.eq.${session.user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${session.user.id})`)
        .maybeSingle()

      if (!existing) {
        // Create new conversation
        await supabase
          .from('conversations')
          .insert({
            user1_id: session.user.id,
            user2_id: otherUserId
          })
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    }
  }

  const handleMessage = async () => {
    // Navigate to messages page - conversation already exists from fetchMatches
    navigate('/messages')
  }

  if (loading) {
    return (
      <>
        <Sidebar />
        <Header userId={session.user.id} />
        <div className="min-h-screen bg-[#0a0a1f] flex items-center justify-center pt-16 lg:pl-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Sidebar />
      <Header userId={session.user.id} />

      <div className="min-h-screen bg-[#0a0a1f] pt-16 pb-28 lg:pb-8 lg:pl-64">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="lg:hidden text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {activeTab === 'matches' ? 'Matches' : 'My Likes'}
              </h1>
            </div>
            <p className="text-gray-400 text-sm">
              {activeTab === 'matches' ? matchCount : likeCount} {activeTab === 'matches' ? (matchCount === 1 ? 'match' : 'matches') : (likeCount === 1 ? 'like' : 'likes')}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-[#1a1a2e]/50 rounded-xl p-1 border border-purple-500/10">
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium text-sm transition-all rounded-lg ${
                activeTab === 'matches'
                  ? 'bg-purple-600 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span>Matches</span>
              {matchCount > 0 && (
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  {matchCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('likes')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium text-sm transition-all rounded-lg ${
                activeTab === 'likes'
                  ? 'bg-purple-600 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>My Likes</span>
              {likeCount > 0 && (
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  {likeCount}
                </span>
              )}
            </button>
          </div>

          {/* Content */}
          {(activeTab === 'matches' ? matches : likes).length === 0 ? (
            <div className="text-center py-12 sm:py-20 px-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                {activeTab === 'matches' ? 'No matches yet' : 'No likes yet'}
              </h2>
              <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6">
                {activeTab === 'matches'
                  ? 'Start liking profiles to find mutual matches!'
                  : 'When someone likes you, they will appear here!'}
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-5 sm:px-6 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm sm:text-base font-medium rounded-full transition-colors"
              >
                Start Exploring
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {(activeTab === 'matches' ? matches : likes).map((item) => (
                <div
                  key={item.id}
                  className="bg-[#1a1a2e]/50 rounded-xl p-4 border border-purple-500/10 hover:border-purple-500/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-purple-500/30">
                      {item.avatar ? (
                        <img
                          src={item.avatar}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-purple-600 flex items-center justify-center text-white font-bold text-xl">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold text-base sm:text-lg truncate">
                        {item.name}
                      </h4>
                      <p className="text-white/50 text-sm truncate">{item.message}</p>
                      <p className="text-white/40 text-xs mt-1">{item.time}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {activeTab === 'matches' && (
                        <button
                          onClick={() => handleMessage()}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                          </svg>
                          Message
                        </button>
                      )}
                      <button className="bg-purple-600/20 hover:bg-purple-600/30 text-white text-sm px-4 py-2 rounded-full font-medium transition-colors">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {createPortal(
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a1f]/95 backdrop-blur-md border-t border-purple-500/20 z-[100]">
          <div className="flex items-center justify-around px-2 py-2">
            <button
              onClick={() => navigate('/')}
              className="flex flex-col items-center gap-1 text-white/60 p-2"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span className="text-[10px] font-medium">Match</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-purple-400 p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span className="text-[10px] font-medium">Likes</span>
            </button>
            <button
              onClick={() => navigate('/messages')}
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
        </nav>,
        document.body
      )}
    </>
  )
}
