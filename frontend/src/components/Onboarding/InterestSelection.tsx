import { useState, useEffect } from 'react'
import { supabase } from '../../client'
import type { Session } from '@supabase/supabase-js'
import RelaxConnectMatchCard from '../RelaxConnectMatchCard'

interface Interest {
  id: string
  name: string
}

interface InterestSelectionProps {
  session: Session
  onComplete: () => void
}

export default function InterestSelection({ session, onComplete }: InterestSelectionProps) {
  const [interests, setInterests] = useState<Interest[]>([])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchInterests()
  }, [])

  async function fetchInterests() {
    try {
      const { data, error } = await supabase
        .from('interests')
        .select('id, name')
        .order('name')

      if (error) throw error
      setInterests(data || [])
    } catch (error) {
      console.error('Error fetching interests:', error)
    }
  }

  const toggleInterest = (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      setSelectedInterests(selectedInterests.filter(id => id !== interestId))
    } else {
      if (selectedInterests.length >= 5) {
        return
      }
      setSelectedInterests([...selectedInterests, interestId])
    }
  }

  const handleContinue = async () => {
    if (selectedInterests.length === 0) {
      return
    }

    try {
      setLoading(true)

      // Delete existing interests
      await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', session.user.id)

      // Insert new interests
      const userInterests = selectedInterests.map(interestId => ({
        user_id: session.user.id,
        interest_id: interestId,
      }))

      const { error } = await supabase
        .from('user_interests')
        .insert(userInterests)

      if (error) throw error

      onComplete()
    } catch (error) {
      console.error('Error saving interests:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-[#0a0a1f] overflow-hidden">
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto bg-[#0a0a1f]">
        <div className="w-full max-w-md mx-auto py-4">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <svg className="w-6 h-6 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <h1 className="text-xl font-bold text-white">MATCHCHAYN</h1>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-1 w-12 bg-purple-600 rounded-full"></div>
            <div className="h-1 w-12 bg-purple-600 rounded-full"></div>
            <div className="h-1 w-12 bg-gray-600 rounded-full"></div>
            <div className="h-1 w-12 bg-gray-600 rounded-full"></div>
            <span className="text-gray-400 text-sm ml-2">2/4</span>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Select up to 5 interest</h2>
            <p className="text-gray-400 text-sm">
              Your interests align you to niche, who also feel like you.
            </p>
            <p className="text-purple-400 text-xs mt-1">
              ({selectedInterests.length}/5 selected)
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {interests.map((interest) => (
              <button
                key={interest.id}
                onClick={() => toggleInterest(interest.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedInterests.includes(interest.id)
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-900 hover:bg-gray-100'
                }`}
                disabled={!selectedInterests.includes(interest.id) && selectedInterests.length >= 5}
              >
                {interest.name}
              </button>
            ))}
          </div>

          <button
            onClick={handleContinue}
            disabled={loading || selectedInterests.length === 0}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors mb-4"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>

          <p className="text-xs text-center text-gray-500">
            By continuing, you agree to matchchayn{' '}
            <span className="underline cursor-pointer">Terms of service</span> and{' '}
            <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
