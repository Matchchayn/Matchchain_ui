import { useState, useEffect } from 'react'
import { supabase } from '../../client'
import type { Session } from '@supabase/supabase-js'
import RelaxConnectMatchCard from '../RelaxConnectMatchCard'

interface ProfileCreationProps {
  session: Session
  onComplete: () => void
  onBack?: () => void
}

export default function ProfileCreation({ session, onComplete, onBack }: ProfileCreationProps) {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onBack) {
        onBack()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBack])

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    dateofbirth: '',
    country: '',
    city: '',
    gender: '',
    relationshipstatus: '',
    bio: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.first_name || !formData.last_name || !formData.username || !formData.dateofbirth || !formData.country || !formData.city || !formData.gender || !formData.relationshipstatus) {
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase.from('Profile').upsert({
        id: session.user.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username,
        dateofbirth: formData.dateofbirth,
        country: formData.country,
        city: formData.city,
        gender: formData.gender,
        relationshipstatus: formData.relationshipstatus,
        bio: formData.bio,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      onComplete()
    } catch (error: any) {
      console.error('Error creating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen lg:h-screen flex flex-col lg:flex-row bg-[#0a0a1f] lg:overflow-hidden">
      {/* Left Side - Image (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative p-4 bg-[#0a0a1f]">
        <div className="relative w-full h-full rounded-2xl overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop"
            alt="Woman smiling"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <RelaxConnectMatchCard />
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-[#0a0a1f] lg:overflow-y-auto">
        <div className="w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <svg className="w-6 h-6 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <h1 className="text-xl font-bold text-white">MATCHCHAYN</h1>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-1 w-12 bg-purple-600 rounded-full"></div>
            <div className="h-1 w-12 bg-gray-600 rounded-full"></div>
            <div className="h-1 w-12 bg-gray-600 rounded-full"></div>
            <div className="h-1 w-12 bg-gray-600 rounded-full"></div>
            <span className="text-gray-400 text-sm ml-2">1/4</span>
          </div>

          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-white mb-2">Create a Profile</h2>
            <p className="text-gray-400 text-sm">Complete your profile to find better matches</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 text-sm mb-1">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 bg-[#1f1f3a] border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 bg-[#1f1f3a] border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 text-sm mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 bg-[#1f1f3a] border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">Date Of Birth</label>
                <input
                  type="date"
                  name="dateofbirth"
                  value={formData.dateofbirth}
                  onChange={handleChange}
                  required
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 bg-[#1f1f3a] border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 text-sm mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 bg-[#1f1f3a] border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 bg-[#1f1f3a] border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 text-sm mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 bg-[#1f1f3a] border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1">Relationship status</label>
                <select
                  name="relationshipstatus"
                  value={formData.relationshipstatus}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 bg-[#1f1f3a] border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select...</option>
                  <option value="single">Single</option>
                  <option value="in_relationship">In a Relationship</option>
                  <option value="married">Married</option>
                  <option value="complicated">It's Complicated</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1">Bio (optional)</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2.5 bg-[#1f1f3a] border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
