import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config'

interface LikedUser {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string
  city: string
  age: number
  likedAt: string
}

export default function Likes() {
  const [likes, setLikes] = useState<LikedUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLikes()
  }, [])

  const fetchLikes = async () => {
    console.log('[Likes] Fetching from /api/user/likes...');
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/user/likes`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!res.ok) {
        console.error('[Likes] Backend returned error status:', res.status);
        setLikes([])
        return
      }

      const data = await res.json()
      console.log('[Likes] Received count:', Array.isArray(data) ? data.length : 0);
      
      if (!Array.isArray(data)) {
        console.error('[Likes] Expected array but got:', data);
        setLikes([])
        return
      }

      // Map backend fields to frontend expectations
      const formatted = data.map((u: any) => {
        // Calculate age from dateOfBirth
        let age = u.age || 0;
        if (u.dateOfBirth) {
          const birthDate = new Date(u.dateOfBirth);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }

        return {
          id: u.id || u._id || String(Math.random()),
          firstName: u.firstName || 'Unknown',
          lastName: u.lastName || '',
          avatarUrl: u.avatarUrl || '',
          city: u.city || '',
          age: age,
          likedAt: u.likedAt || new Date().toISOString()
        }
      })

      setLikes(formatted)
    } catch (err) {
      console.error('[Likes] Critical error during fetch:', err)
      setLikes([])
    } finally {
      console.log('[Likes] Setting loading false');
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 min-h-screen bg-[#090a1e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Likes</h1>
            <p className="text-gray-400 mt-1">People who liked your profile</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-full">
            <span className="text-purple-400 font-bold">{likes.length} Likes</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : likes.length === 0 ? (
          <div className="text-center py-20 bg-[#1a1a2e]/30 rounded-3xl border border-white/5">
            <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-purple-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">No likes yet</h3>
            <p className="text-gray-500 max-w-xs mx-auto text-sm">Keep active on MatchChayn to get more visibility and likes!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {likes.map((user) => (
              <div key={user.id} className="bg-[#0d0e24] rounded-2xl overflow-hidden border border-white/5 hover:border-purple-500/30 transition-all group">
                <div className="aspect-[4/5] relative">
                  <img
                    src={user.avatarUrl || '/placeholder-avatar.png'}
                    alt={user.firstName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold truncate">{user.firstName}, {user.age}</h3>
                    <p className="text-gray-300 text-xs truncate">{user.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
