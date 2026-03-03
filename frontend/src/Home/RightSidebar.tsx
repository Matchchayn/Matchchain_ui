import { useState, useEffect } from 'react'
import { fetchLikes, fetchMatches } from '../utils/likesHandler'
import Stories from './Stories'

interface Match {
  id: string
  name: string
  avatar: string
  message: string
  time: string
}

// Module-level cache for sidebar data
let cachedLikes: Match[] | null = null;
let cachedMatches: Match[] | null = null;

interface RightSidebarProps {
  session: any
  mobileView?: boolean
}

export default function RightSidebar({ session, mobileView = false }: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<'matches' | 'likes'>('matches')
  const [matches, setMatches] = useState<Match[]>([])
  const [likes, setLikes] = useState<Match[]>([])
  const [matchCount, setMatchCount] = useState(0)
  const [likeCount, setLikeCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    if (session?.token) {
      if (cachedLikes || cachedMatches) {
        if (cachedLikes) {
          setLikes(cachedLikes);
          setLikeCount(cachedLikes.length);
        }
        if (cachedMatches) {
          setMatches(cachedMatches);
          setMatchCount(cachedMatches.length);
        }
        setLoading(false);
        loadData(true); // Silent background refresh
      } else {
        loadData();
      }

      const interval = setInterval(() => {
        loadData(true);
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [session])

  const loadData = async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const token = session.token;

      const [likesData, matchesData] = await Promise.all([
        fetchLikes(token),
        fetchMatches(token)
      ]);

      const formattedLikes = likesData.map((user: any) => ({
        id: user._id,
        name: `${user.firstName || 'User'} ${user.lastName || ''}`,
        avatar: user.avatarUrl || '',
        message: 'SENT A MATCH REQUEST',
        time: 'Just now'
      }));

      const formattedMatches = matchesData.map((user: any) => ({
        id: user._id,
        name: `${user.firstName || 'User'} ${user.lastName || ''}`,
        avatar: user.avatarUrl || '',
        message: "It's a match!",
        time: 'Matched'
      }));

      setLikes(formattedLikes);
      setLikeCount(formattedLikes.length);
      setMatches(formattedMatches);
      setMatchCount(formattedMatches.length);

      // Update cache
      cachedLikes = formattedLikes;
      cachedMatches = formattedMatches;

    } catch (error) {
      console.error('Error loading sidebar data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation()
    const token = session.token
    if (!token) return

    try {
      setProcessingId(userId)
      const { likeProfile } = await import('../utils/likesHandler')
      const result = await likeProfile(token, userId)
      if (result.success) {
        await loadData(true)
      }
    } catch (error) {
      console.error('Error accepting match:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation()
    const token = session.token
    if (!token) return

    try {
      setProcessingId(userId)
      const { API_BASE_URL } = await import('../config')
      const response = await fetch(`${API_BASE_URL}/api/user/reject-like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetUserId: userId })
      })

      if (response.ok) {
        await loadData(true)
      }
    } catch (error) {
      console.error('Error rejecting match:', error)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="sticky top-24 space-y-4">
      <Stories layout={mobileView ? 'mobile' : 'sidebar'} />

      {/* Promotional Banner */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl p-4 relative overflow-hidden group shadow-lg">
        <div className="relative z-10">
          <h3 className="text-white text-sm font-bold mb-1.5 tracking-wider flex items-center gap-2">
            Matchchain VIP
            <span className="bg-white/20 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase">Soon</span>
          </h3>
          <p className="text-white/90 text-xs mb-3 leading-snug font-medium">
            Boost your frequency and get seen by 10x more people on the edge.
          </p>
          <button className="w-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-lg transition-all text-xs tracking-widest active:scale-95">
            Level Up
          </button>
        </div>
        <div className="absolute bottom-0 right-0 opacity-10 group-hover:scale-110 transition-transform p-4">
          <img
            src="/matchlogo.png"
            alt=""
            className="w-20 h-20 object-contain brightness-0 invert"
          />
        </div>
      </div>

      {/* Matches / My Likes Section */}
      {!mobileView && (
        <div className="bg-[#1a1a2e]/50 rounded-xl border border-purple-500/10 overflow-hidden shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-purple-500/10">
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-bold text-xs tracking-widest transition-all relative ${activeTab === 'matches'
                ? 'text-purple-400'
                : 'text-white/40 hover:text-white/60'
                }`}
            >
              <span>Matches</span>
              {matchCount > 0 && (
                <span className="bg-purple-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {matchCount}
                </span>
              )}
              {activeTab === 'matches' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('likes')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-bold text-xs tracking-widest transition-all relative ${activeTab === 'likes'
                ? 'text-purple-400'
                : 'text-white/40 hover:text-white/60'
                }`}
            >
              <span>Received</span>
              {likeCount > 0 && (
                <span className="bg-pink-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {likeCount}
                </span>
              )}
              {activeTab === 'likes' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
              )}
            </button>
          </div>

          {/* Match/Likes List */}
          <div className="p-2 space-y-1 max-h-[440px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="space-y-3 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/10 rounded w-2/3"></div>
                      <div className="h-3 bg-white/5 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (activeTab === 'matches' ? matches : likes).length === 0 ? (
              <div className="text-center py-12">
                <img
                  src="/matchlogo.png"
                  alt=""
                  className="w-10 h-10 object-contain opacity-5 mx-auto mb-3"
                />
                <p className="text-white/20 text-[10px] tracking-widest font-mono">
                  No signals found
                </p>
              </div>
            ) : (
              (activeTab === 'matches' ? matches : likes).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-500/5 transition-all group cursor-pointer border border-transparent hover:border-purple-500/10"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-purple-500/20 group-hover:ring-purple-500/50 transition-all">
                    {item.avatar ? (
                      <img
                        src={item.avatar}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-purple-600/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-sm truncate group-hover:text-purple-300 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-white/40 text-[10px] tracking-tighter truncate">{item.message}</p>

                    {/* Quick Actions for Received Tab */}
                    {activeTab === 'likes' && (
                      <div className="flex gap-1.5 mt-2">
                        <button
                          onClick={(e) => handleAccept(e, item.id)}
                          disabled={processingId === item.id}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-[9px] font-black uppercase tracking-tighter py-1 rounded-md text-white transition-all disabled:opacity-50"
                        >
                          {processingId === item.id ? '...' : 'Accept'}
                        </button>
                        <button
                          onClick={(e) => handleReject(e, item.id)}
                          disabled={processingId === item.id}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-1 rounded-md border border-red-500/20 disabled:opacity-50"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-white/20 text-[9px] font-mono">{item.time}</span>
                    <div className={`w-2 h-2 rounded-full ${item.avatar ? 'bg-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-gray-500'}`}></div>
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
