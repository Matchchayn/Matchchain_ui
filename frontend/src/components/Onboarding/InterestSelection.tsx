import { useState, useEffect } from 'react'
import RelaxConnectMatchCard from '../RelaxConnectMatchCard'
import onboardingstock from '../../assets/onboardingstock.jpg'
import { clearProfileCache } from '../../utils/userProfileService'

import { useAlert } from '../../hooks/useAlert'
import { API_BASE_URL } from '../../config';

interface Interest {
  id: string
  name: string
}

interface InterestSelectionProps {
  session: any
  onComplete: () => void
  onBack?: () => void
}

export default function InterestSelection({ session, onComplete, onBack }: InterestSelectionProps) {
  const { showAlert } = useAlert()
  const [interests, setInterests] = useState<Interest[]>([])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchInterests()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onBack) {
        onBack()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBack])

  async function fetchInterests() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/interests`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to fetch interests')
      setInterests(data || [])
    } catch (error) {
      console.error('Error fetching interests:', error)
    }
  }

  const toggleInterest = (interestName: string) => {
    if (selectedInterests.includes(interestName)) {
      setSelectedInterests(selectedInterests.filter(name => name !== interestName))
    } else {
      if (selectedInterests.length >= 5) {
        return
      }
      setSelectedInterests([...selectedInterests, interestName])
    }
  }

  const handleContinue = async () => {
    if (selectedInterests.length === 0) {
      showAlert('Please select at least one interest', 'warning')
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`${API_BASE_URL}/api/user/interests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`
        },
        body: JSON.stringify({ interests: selectedInterests }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to save interests')

      clearProfileCache()
      showAlert('Interests saved!', 'success')
      onComplete()
    } catch (error: any) {
      showAlert(error.message, 'error')
      console.error('Error saving interests:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#090a1e]">
      {/* Left Side - Image */}
      <div className="hidden lg:block lg:w-1/2 lg:flex-shrink-0 relative bg-[#090a1e]">
        <div className="relative w-full h-full overflow-hidden">
          <img
            src={onboardingstock}
            alt="Woman smiling"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <RelaxConnectMatchCard />
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 min-h-screen bg-[#090a1e]">
        <div className="w-full max-w-md text-white">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <svg className="w-8 h-8 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <h1 className="text-2xl font-bold uppercase tracking-widest">MATCHCHAYN</h1>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-1 flex-1 bg-purple-600 rounded-full"></div>
            <div className="h-1 flex-1 bg-purple-600 rounded-full"></div>
            <div className="h-1 flex-1 bg-gray-800 rounded-full"></div>
            <div className="h-1 flex-1 bg-gray-800 rounded-full"></div>
            <span className="text-gray-400 text-xs ml-2 font-mono">2/4</span>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-3">Select Interests</h2>
            <p className="text-gray-400 text-base max-w-sm mx-auto">
              Your interests help us find you the perfect frequency on-chain. Pick up to 5.
            </p>
            <p className="text-purple-400 font-mono text-xs mt-3">
              ({selectedInterests.length}/5 selected)
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {interests.map((interest) => (
              <button
                key={interest.id}
                onClick={() => toggleInterest(interest.name)}
                className={`px-6 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-300 ${selectedInterests.includes(interest.name)
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'bg-transparent border-gray-700 text-gray-400 hover:border-purple-500 hover:text-white'
                  }`}
                disabled={!selectedInterests.includes(interest.name) && selectedInterests.length >= 5}
              >
                {interest.name}
              </button>
            ))}
          </div>

          <button
            onClick={handleContinue}
            disabled={loading || selectedInterests.length === 0}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-bold rounded-full transition-all active:scale-[0.98] mb-6"
          >
            {loading ? 'Saving Your Vibe...' : 'Lock It In'}
          </button>


          <p className="text-[10px] text-center text-gray-600 uppercase tracking-widest leading-loose">
            By continuing, you agree to Matchchayn<br />
            <span className="text-gray-400 hover:text-purple-400 cursor-pointer">Terms of service</span> & <span className="text-gray-400 hover:text-purple-400 cursor-pointer">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  )
}
