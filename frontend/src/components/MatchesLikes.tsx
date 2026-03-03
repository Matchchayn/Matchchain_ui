import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../Home/Header'
import Sidebar from './Sidebar'
import { API_BASE_URL } from '../config'
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

  const handleRejectMatch = async (userId: string) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setProcessingId(userId)
      const response = await fetch(`${API_BASE_URL}/api/user/reject-like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetUserId: userId })
      })

      if (response.ok) {
        showAlert('Match request declined', 'info')
        await loadData()
      } else {
        showAlert('Failed to decline match', 'error')
      }
    } catch (error) {
      console.error('Error rejecting match:', error)
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
        <div className="min-h-screen bg-[#090a1e] pt-24 pb-28 lg:pb-8 lg:pl-64">
          <div className="max-w-7xl mx-auto px-4">
            <div className="h-10 bg-white/5 rounded-lg w-48 mb-6 animate-pulse" />
            <div className="h-14 bg-white/5 rounded-xl mb-8 animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-[#1a1a2e]/50 rounded-2xl p-4 border border-white/5 h-32 animate-pulse flex gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-white/10 flex-shrink-0" />
                  <div className="flex-1 space-y-3 mt-2">
                    <div className="h-5 bg-white/10 rounded w-1/3" />
                    <div className="h-4 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 p-5">
                <img
                  src="/matchlogo.png"
                  alt=""
                  className="w-full h-full object-contain opacity-20"
                />
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(activeTab === 'matches' ? matches : receivedLikes).map((item) => (
                <div
                  key={item.id}
                  className="bg-[#1a1a2e]/50 rounded-2xl p-4 border border-purple-500/10 hover:border-purple-500/30 transition-all group relative overflow-hidden"
                >
                  <div className="flex gap-4">
                    {/* Avatar with Status */}
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-2 ring-purple-500/20">
                        {item.avatar ? (
                          <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-purple-600/20 flex items-center justify-center">
                            <span className="text-2xl font-bold text-purple-400">{item.name[0]}</span>
                          </div>
                        )}
                      </div>
                      <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[#1a1a2e] ${item.is_online ? 'bg-green-500' : 'bg-gray-500 shadow-inner'}`} />
                      {activeTab === 'received' && (
                        <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-purple-600 rounded-full border-2 border-[#1a1a2e] flex items-center justify-center shadow-xl">
                          <img src="/matchlogo.png" alt="" className="w-3.5 h-3.5 object-contain brightness-0 invert" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-white font-bold text-lg truncate group-hover:text-purple-400 transition-colors">
                            {item.name}
                          </h4>
                          <span className="text-white/30 text-[10px] uppercase font-bold tracking-tighter whitespace-nowrap">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-white/50 text-xs sm:text-sm font-medium uppercase tracking-widest mt-0.5">
                          {item.message}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3">
                        {activeTab === 'matches' ? (
                          <>
                            <button
                              onClick={() => handleMessage(item.id)}
                              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold py-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                              </svg>
                              Chat Now
                            </button>
                            <button
                              onClick={() => navigate(`/profile/${item.id}`)}
                              className="p-2.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl transition-colors border border-white/5"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleAcceptMatch(item.id)}
                              disabled={processingId === item.id}
                              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs sm:text-sm font-black uppercase tracking-widest py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {processingId === item.id ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : 'Accept'}
                            </button>
                            <button
                              onClick={() => handleRejectMatch(item.id)}
                              disabled={processingId === item.id}
                              className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors border border-red-500/20 active:scale-95 group/btn"
                            >
                              <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
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
