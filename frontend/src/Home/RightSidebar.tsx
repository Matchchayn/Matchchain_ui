import { useState, useEffect } from 'react'
import { fetchLikes, fetchMatches } from '../utils/likesHandler'
import Stories from './Stories'

function SidebarAvatar({ src, name }: { src?: string; name?: string }) {
  const [failed, setFailed] = useState(false)
  const initial = name?.charAt(0)?.toUpperCase() || '?'
  if (!src || failed) {
    return (
      <div className="w-full h-full bg-purple-600/60 flex items-center justify-center">
        <span className="text-white text-base font-bold">{initial}</span>
      </div>
    )
  }
  return <img src={src} alt={name} className="w-full h-full object-cover" onError={() => setFailed(true)} />
}

interface RightSidebarProps {
  session: any
  mobileView?: boolean
}

interface Match {
  id: string
  name: string
  avatar: string
  message: string
  time: string
}

export default function RightSidebar({ session, mobileView = false }: RightSidebarProps) {
  const [activeTab, setActiveTab] = useState<'matches' | 'likes'>('matches')
  // Don't use stale module cache — always reload fresh signed URLs
  const [matches, setMatches] = useState<Match[]>([])
  const [likes, setLikes] = useState<Match[]>([])
  const [matchCount, setMatchCount] = useState(0)
  const [likeCount, setLikeCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    if (session?.token) {
      loadData();

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
    <div className={`${mobileView ? 'w-full' : 'sticky top-24'} space-y-4`}>
      {!mobileView && <Stories layout="sidebar" />}

      {!mobileView && (
        <div className="bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl p-4 relative overflow-hidden group shadow-lg">
          <div className="relative z-10">
            <h3 className="text-white text-sm font-bold mb-1.5 tracking-wider flex items-center gap-2">
              MatchChayn VIP
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
      )}

      {/* Matches / My Likes Section */}
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
        <div className="p-2 space-y-1 h-[280px] overflow-y-auto scrollbar-hide">
          {loading && matches.length === 0 && likes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-50">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] text-white/40 tracking-widest font-mono">Syncing signals...</p>
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
                  <SidebarAvatar src={item.avatar} name={item.name} />
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
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-[9px] font-black uppercase tracking-tighter py-1 rounded-md text-white transition-all disabled:opacity-50 flex items-center justify-center min-h-[20px]"
                      >
                        {processingId === item.id ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : 'Accept'}
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
    </div>
  )
}
