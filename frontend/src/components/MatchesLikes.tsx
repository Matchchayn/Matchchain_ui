import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import { safeLocalStorageSet } from '../utils/storageUtils';
import { fetchLikes, fetchMatches, likeProfile, fetchLikedProfiles, getLikesCache, getMatchesCache, getLikedProfilesCache } from '../utils/likesHandler'
import { useAlert } from '../hooks/useAlert'

// Smart avatar that shows initials, then swaps to photo when loaded successfully
function AvatarCard({ src, name, className }: { src?: string | null; name?: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  const initial = name?.charAt(0)?.toUpperCase() || '?'
  const baseClass = className || 'w-full h-full object-cover'

  if (!src || failed) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center">
        <span className="text-white text-4xl font-black">{initial}</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name || 'User'}
      className={baseClass}
      onError={() => setFailed(true)}
    />
  )
}


export default function MatchesLikes({ session }: { session: any }) {
  const navigate = useNavigate()
  const { showAlert } = useAlert()
  // Don't pre-load from localStorage — signed URLs expire and cause broken images.
  // Always start empty so the fresh signed URLs from the backend are fetched immediately.
  const [matches, setMatches] = useState<any[]>(() => {
    const c = getMatchesCache();
    return c ? c.map((u:any) => ({...u, id: String(u._id || u.id)})) : [];
  })
  const [likes, setLikes] = useState<any[]>(() => {
    const c = getLikesCache();
    return c ? c.map((u:any) => ({...u, id: String(u._id || u.id)})) : [];
  })
  const [liked, setLiked] = useState<any[]>(() => {
    const c = getLikedProfilesCache();
    return c ? c.map((u:any) => ({...u, id: String(u._id || u.id)})) : [];
  })
  const hasCachedData = () => !!(getMatchesCache()?.length || getLikesCache()?.length || getLikedProfilesCache()?.length)
  const [loading, setLoading] = useState(() => !hasCachedData())
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'matches' | 'sent' | 'received'>('matches')

  useEffect(() => {
    // When returning from Messages tab, show cached data and refresh in background (no spinner).
    fetchData(hasCachedData())
  }, [])

  const fetchData = async (isSilent = false) => {
    try {
      if (!isSilent && matches.length === 0 && likes.length === 0 && liked.length === 0) {
        // Only set loading screen if we have absolutely nothing to show
        setLoading(true)
      } else {
        // Keep the UI visible, but maybe show a tiny background sync indicator if we wanted to
      }
      const token = localStorage.getItem('token')
      if (!token) return;

      const [likesData, matchesData, sentData] = await Promise.all([
        fetchLikes(token, isSilent),
        fetchMatches(token, isSilent),
        fetchLikedProfiles(token, isSilent)
      ]);

      const formattedLikes = likesData.map((user: any) => ({
        ...user,
        id: String(user._id || user.id),
      }));

      const formattedMatches = matchesData.map((user: any) => ({
        ...user,
        id: String(user._id || user.id),
      }));

      const formattedSent = sentData.map((user: any) => ({
        ...user,
        id: String(user._id || user.id),
      }));

      setMatches(formattedMatches)
      setLikes(formattedLikes)
      setLiked(formattedSent)

      safeLocalStorageSet(`matches_${session.user.id || session.user._id}`, formattedMatches, 50);
      safeLocalStorageSet(`likes_received_${session.user.id || session.user._id}`, formattedLikes, 50);
      safeLocalStorageSet(`likes_sent_${session.user.id || session.user._id}`, formattedSent, 50);
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (e: React.MouseEvent, user: { id: string; [k: string]: any }) => {
    e.stopPropagation()
    const token = localStorage.getItem('token')
    if (!token) return

    const userId = user.id
    // Optimistic: remove from Received list immediately so Accept feels instant
    setLikes(prev => prev.filter(u => u.id !== userId))

    try {
      const result = await likeProfile(token, userId)
      if (result.success) {
        showAlert("It's a match!", 'success')
        if (result.isMatch) {
          setMatches(prev => [{ ...user, id: userId }, ...prev])
        }
        fetchData(true) // Refresh in background (no await)
      } else {
        showAlert(result.error || 'Failed to accept', 'error')
        setLikes(prev => [...prev, user]) // Roll back on failure
      }
    } catch (error) {
      console.error('Error accepting match:', error)
      showAlert('Failed to accept', 'error')
      setLikes(prev => [...prev, user]) // Roll back on error
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation()
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
        showAlert('Removed from likes', 'info')
        fetchData(true)
      } else {
        showAlert('Failed to reject', 'error')
      }
    } catch (error) {
      console.error('Error rejecting match:', error)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="flex-1 bg-[#090a1e] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">
        {/* Tabs */}
        <div className="flex border-b border-white/5 mb-8">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-8 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'matches' ? 'border-purple-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            Matches ({matches.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-8 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'sent' ? 'border-purple-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            Likes Sent ({liked.length})
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`px-8 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'received' ? 'border-purple-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            Likes Received ({likes.length})
          </button>
        </div>

        {loading && matches.length === 0 && likes.length === 0 && liked.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {activeTab === 'matches' ? (
              matches.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <p className="text-gray-400">No matches yet. Keep discovering!</p>
                </div>
              ) : (
                matches.map((match: any) => (
                  <div
                    key={match._id || match.id}
                    onClick={() => navigate('/messages')}
                    className="bg-[#0d0e24] rounded-2xl overflow-hidden cursor-pointer group hover:ring-2 hover:ring-purple-500/50 transition-all shadow-xl"
                  >
                    <div className="aspect-[3/4] relative">
                      <AvatarCard
                        src={match.avatarUrl}
                        name={match.firstName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e24] via-transparent opacity-80"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white font-bold truncate leading-tight">
                          {match.firstName}
                        </h3>
                        <p className="text-purple-400 text-[10px] font-black uppercase mt-1 tracking-wider">It's a match!</p>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : activeTab === 'received' ? (
              likes.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <p className="text-gray-400">No new likes received. Keep swiping!</p>
                </div>
              ) : (
                likes.map((user) => (
                  <div
                    key={user.id}
                    className="bg-[#0d0e24] rounded-2xl overflow-hidden group shadow-xl border border-white/5 relative"
                  >
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <AvatarCard
                        src={user.avatarUrl}
                        name={user.firstName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      <div className="absolute top-3 left-3">
                        <div className="bg-purple-600/90 backdrop-blur-md text-white font-black text-[8px] px-2 py-1 rounded-full shadow-lg tracking-widest uppercase">
                          Vibing you
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white font-bold leading-tight mb-3">
                          {user.firstName}
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => handleAccept(e, user)}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-[10px] font-black uppercase py-2 rounded-xl text-white transition-all active:scale-95 flex items-center justify-center min-h-[32px]"
                          >
                            Accept
                          </button>
                          <button
                            onClick={(e) => handleReject(e, user.id)}
                            disabled={processingId === user.id}
                            className="bg-white/10 hover:bg-red-500/20 text-white p-2 rounded-xl border border-white/10 transition-all disabled:opacity-50 active:scale-95"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              liked.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <p className="text-gray-400">You haven't liked anyone yet!</p>
                </div>
              ) : (
                liked.map((user) => (
                  <div
                    key={user.id}
                    className="bg-[#0d0e24] rounded-2xl overflow-hidden group shadow-xl border border-white/5 relative"
                  >
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <AvatarCard
                        src={user.avatarUrl}
                        name={user.firstName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white font-bold leading-tight">
                          {user.firstName}
                        </h3>
                        <p className="text-purple-400/70 text-[10px] mt-1 font-bold uppercase tracking-wider">Awaiting response</p>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
