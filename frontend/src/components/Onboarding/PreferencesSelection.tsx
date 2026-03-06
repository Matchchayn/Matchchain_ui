import { useState, useEffect } from 'react'
import RelaxConnectMatchCard from '../RelaxConnectMatchCard'
import onboardingstock from '../../assets/onboardingstock.jpg'
import { clearProfileCache } from '../../utils/userProfileService'

import CustomDropdown from '../Common/CustomDropdown'

import { useAlert } from '../../hooks/useAlert'
import { API_BASE_URL } from '../../config';

interface PreferencesSelectionProps {
  session: any
  onComplete: () => void
  onBack?: () => void
}

export default function PreferencesSelection({ session, onComplete, onBack }: PreferencesSelectionProps) {
  const { showAlert } = useAlert()
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

  const [preferences, setPreferences] = useState({
    lookingForGender: '',
    lookingForRelationshipStatus: '',
    distanceKm: 50,
    ageMin: 18,
    ageMax: 40,
    heightMinCm: 150,
    heightMaxCm: 200
  })

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'any', label: 'Any' }
  ]

  const statusOptions = [
    { value: 'single', label: 'Single' },
    { value: 'in_relationship', label: 'In a Relationship' },
    { value: 'married', label: 'Married' },
    { value: 'complicated', label: "It's Complicated" },
    { value: 'any', label: 'Any' }
  ]

  const handleSubmit = async () => {
    if (!preferences.lookingForGender || !preferences.lookingForRelationshipStatus) {
      showAlert('Please select your preferences', 'warning')
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`${API_BASE_URL}/api/user/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`
        },
        body: JSON.stringify({ preferences }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to save preferences')

      clearProfileCache()
      showAlert('Preferences saved!', 'success')
      onComplete()
    } catch (error: any) {
      showAlert(error.message, 'error')
      console.error('Error saving preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#090a1e] text-white">
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
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src="/favicon.png" alt="MatchChayn" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
            <h1 className="text-2xl font-bold tracking-widest">MatchChayn</h1>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-1 flex-1 bg-purple-600 rounded-full"></div>
            <div className="h-1 flex-1 bg-purple-600 rounded-full"></div>
            <div className="h-1 flex-1 bg-purple-600 rounded-full"></div>
            <div className="h-1 flex-1 bg-gray-800 rounded-full"></div>
            <span className="text-gray-400 text-xs ml-2 font-mono">3/4</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-3 text-white">Your Frequency</h2>
            <p className="text-gray-400 text-base">Who are you looking to meet on-chain?</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <CustomDropdown
                label="Gender"
                options={genderOptions}
                value={preferences.lookingForGender}
                onChange={(val) => setPreferences({ ...preferences, lookingForGender: val })}
              />
              <CustomDropdown
                label="Status"
                options={statusOptions}
                value={preferences.lookingForRelationshipStatus}
                onChange={(val) => setPreferences({ ...preferences, lookingForRelationshipStatus: val })}
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-gray-400 text-xs font-mono uppercase">Max Distance</label>
                <span className="text-purple-400 font-mono text-sm">{preferences.distanceKm} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="500"
                value={preferences.distanceKm}
                onChange={(e) => setPreferences({ ...preferences, distanceKm: parseInt(e.target.value) })}
                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-gray-400 text-xs font-mono uppercase">Age Range</label>
                <span className="text-purple-400 font-mono text-sm">{preferences.ageMin} - {preferences.ageMax}</span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="18"
                  max="100"
                  value={preferences.ageMin}
                  onChange={(e) => setPreferences({ ...preferences, ageMin: Math.min(parseInt(e.target.value), preferences.ageMax - 1) })}
                  className="flex-1 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <input
                  type="range"
                  min="18"
                  max="100"
                  value={preferences.ageMax}
                  onChange={(e) => setPreferences({ ...preferences, ageMax: Math.max(parseInt(e.target.value), preferences.ageMin + 1) })}
                  className="flex-1 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-gray-400 text-xs font-mono uppercase">Height (cm)</label>
                <span className="text-purple-400 font-mono text-sm">{preferences.heightMinCm} - {preferences.heightMaxCm}</span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="100"
                  max="250"
                  value={preferences.heightMinCm}
                  onChange={(e) => setPreferences({ ...preferences, heightMinCm: Math.min(parseInt(e.target.value), preferences.heightMaxCm - 1) })}
                  className="flex-1 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <input
                  type="range"
                  min="100"
                  max="250"
                  value={preferences.heightMaxCm}
                  onChange={(e) => setPreferences({ ...preferences, heightMaxCm: Math.max(parseInt(e.target.value), preferences.heightMinCm + 1) })}
                  className="flex-1 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>
            </div>
          </div>


          <div className="mt-8 flex gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-full transition-all active:scale-[0.98]"
              >
                Back
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-[2] py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-bold rounded-full transition-all active:scale-[0.98]"
            >
              {loading ? 'Processing...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
