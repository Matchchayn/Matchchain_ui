import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../Home/Header'
import Sidebar from './Sidebar'
import TopLoader from './Common/TopLoader'
import { fetchLikes, fetchMatches, likeProfile } from '../utils/likesHandler'
import MobileBottomNav from './MobileBottomNav'
import { useAlert } from '../hooks/useAlert'
import Stories from '../Home/Stories'

interface Match {
  id: string
  name: string
  avatar: string
  message: string
  time: string
  is_online?: boolean
}

interface MatchesLikesProps {
  session: any
}

export default function MatchesLikes({ session }: MatchesLikesProps) {
  const navigate = useNavigate()
  const { showAlert } = useAlert()
  const [activeTab, setActiveTab] = useState<'matches' | 'received'>('matches')
  const [matches, setMatches] = useState<Match[]>(() => {
    const cached = localStorage.getItem('cache_matches')
    return cached ? JSON.parse(cached) : []
  })
  const [receivedLikes, setReceivedLikes] = useState<Match[]>(() => {
    const cached = localStorage.getItem('cache_likes')
    return cached ? JSON.parse(cached) : []
  })
  const [matchCount, setMatchCount] = useState(0)
  const [receivedCount, setReceivedCount] = useState(0)
  const [loading, setLoading] = useState(() => !localStorage.getItem('cache_matches'))
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    loadData()

    // Setup socket for live status
    import('../utils/socketService').then(({ socketService }) => {
      const socket = socketService.getSocket()
      if (socket) {
        socket.on('status_change', (data: any) => {
          setMatches(prev => prev.map(m => m.id === data.userId ? { ...m, is_online: data.isOnline } : m))
          setReceivedLikes(prev => prev.map(l => l.id === data.userId ? { ...l, is_online: data.isOnline } : l))
        })
      }
    })

    // Set up polling to check for new likes/matches every 10 seconds
    const interval = setInterval(() => loadData(false), 10000)

    return () => clearInterval(interval)
  }, [])

  const loadData = async (showLoading = true) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      if (showLoading && !matches.length) setLoading(true)
      const [likesData, matchesData] = await Promise.all([
        fetchLikes(token),
        fetchMatches(token)
      ])

      const formattedLikes = likesData.map((user: any) => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName || ''}`.trim(),
        avatar: user.avatarUrl,
        message: 'SENT A MATCH REQUEST',
        time: 'Just now',
        is_online: user.isOnline
      }))

      const formattedMatches = matchesData.map((user: any) => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName || ''}`.trim(),
        avatar: user.avatarUrl,
        message: "It's a match!",
        time: 'Matched',
        is_online: user.isOnline
      }))

      setReceivedLikes(formattedLikes)
      setReceivedCount(formattedLikes.length)
      setMatches(formattedMatches)
      setMatchCount(formattedMatches.length)

      localStorage.setItem('cache_matches', JSON.stringify(formattedMatches))
      localStorage.setItem('cache_likes', JSON.stringify(formattedLikes))
    } catch (error) {
      console.error('Error loading matches/likes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptMatch = async (userId: string) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setProcessingId(userId)
      const result = await likeProfile(token, userId)
      if (result.success) {
        showAlert('Match request accepted!', 'success')
        // Refresh data to show the new match
        await loadData()
      } else {
        showAlert(result.error || 'Failed to accept match', 'error')
      }
    } catch (error) {
      console.error('Error accepting match:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleMessage = (_userId: string) => {
    // Navigate to messages page
    navigate('/messages')
  }

  if (loading) {
    return (
      <>
        <Sidebar />
        <Header userId={session.user.id || session.user._id} />
        <TopLoader message="Loading..." />
        <div className="min-h-screen bg-[#090a1e] pt-16 lg:pl-64" />
      </>
    )
  }

  return (
    <>
      <Sidebar />
      <Header userId={session.user.id || session.user._id} />

      <div className="min-h-screen bg-[#090a1e] pt-16 pb-28 lg:pb-8 lg:pl-64">
        {/* Stories section - below header */}
        <div className="w-full bg-[#090a1e]/50 backdrop-blur-md border-b border-white/5">
          <Stories layout="mobile" />
        </div>

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
              <h1 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-wider">
                {activeTab === 'matches' ? 'Matches' : 'Received'}
              </h1>
            </div>
            <p className="text-gray-400 text-sm">
              {activeTab === 'matches' ? matchCount : receivedCount} {activeTab === 'matches' ? (matchCount === 1 ? 'match' : 'matches') : (receivedCount === 1 ? 'request' : 'requests')}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-[#1a1a2e]/50 rounded-xl p-1 border border-purple-500/10">
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-bold text-sm transition-all rounded-lg uppercase tracking-widest ${activeTab === 'matches'
                ? 'bg-purple-600/20 text-white border-b-2 border-purple-500'
                : 'text-white/60 hover:text-white/80'
                }`}
            >
              <span>Matches</span>
              {matchCount > 0 && (
                <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {matchCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-bold text-sm transition-all rounded-lg uppercase tracking-widest ${activeTab === 'received'
                ? 'bg-purple-600/20 text-white border-b-2 border-purple-500'
                : 'text-white/60 hover:text-white/80'
                }`}
            >
              <span>Received</span>
              {receivedCount > 0 && (
                <span className="bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                  {receivedCount}
                </span>
              )}
            </button>
          </div>

          {/* Content */}
          {(activeTab === 'matches' ? matches : receivedLikes).length === 0 ? (
            <div className="text-center py-12 sm:py-20 px-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                {activeTab === 'matches' ? 'No matches yet' : 'No requests yet'}
              </h2>
              <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6">
                {activeTab === 'matches'
                  ? 'Start liking profiles to find mutual matches!'
                  : 'People who like you will appear here!'}
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
              {(activeTab === 'matches' ? matches : receivedLikes).map((item) => (
                <div
                  key={item.id}
                  className="bg-[#1a1a2e]/50 rounded-xl p-4 border border-purple-500/10 hover:border-purple-500/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-purple-500/30">
                        {item.avatar ? (
                          <img
                            src={item.avatar}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-purple-600/20 flex items-center justify-center">
                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1a1a2e] ${item.is_online ? 'bg-green-500' : 'bg-gray-500'}`} />
                      </div>
                      {activeTab === 'received' && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full border-2 border-[#1a1a2e] flex items-center justify-center shadow-lg">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-white font-bold text-base sm:text-lg truncate group-hover:text-purple-400 transition-colors">
                          {item.name}
                        </h4>
                        <span className="text-white/30 text-[10px] sm:text-xs">Just now</span>
                      </div>
                      <p className="text-white/50 text-xs sm:text-sm truncate uppercase tracking-tight">{item.message}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {activeTab === 'matches' ? (
                        <button
                          onClick={() => handleMessage(item.id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm px-4 py-2 rounded-full font-bold transition-all shadow-lg shadow-purple-900/20 active:scale-95 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                          </svg>
                          <span className="hidden sm:inline">Message</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAcceptMatch(item.id)}
                          disabled={processingId === item.id}
                          className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs sm:text-sm px-6 py-2 rounded-full font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {processingId === item.id ? '...' : 'Accept'}
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/profile/${item.id}`)}
                        className="bg-white/5 hover:bg-white/10 text-white/70 text-xs px-3 py-2 rounded-full font-medium transition-colors border border-white/5"
                      >
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

      <MobileBottomNav />
    </>
  )
}
