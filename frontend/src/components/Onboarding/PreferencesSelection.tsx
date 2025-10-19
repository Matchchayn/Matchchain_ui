import { useState, useEffect } from 'react'
import { supabase } from '../../client'
import type { Session } from '@supabase/supabase-js'
import RelaxConnectMatchCard from '../RelaxConnectMatchCard'

interface PreferencesSelectionProps {
  session: Session
  onComplete: () => void
  onBack?: () => void
}

export default function PreferencesSelection({ session, onComplete, onBack }: PreferencesSelectionProps) {
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
    looking_for_gender: '',
    looking_for_relationship_status: '',
    distance_km: 186,
    age_min: 18,
    age_max: 40,
    height_min_cm: 158,
    height_max_cm: 300
  })

  const handleSubmit = async () => {
    if (!preferences.looking_for_gender || !preferences.looking_for_relationship_status) {
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase.from('user_preferences').upsert({
        user_id: session.user.id,
        looking_for_gender: preferences.looking_for_gender,
        looking_for_relationship_status: preferences.looking_for_relationship_status,
        distance_km: preferences.distance_km,
        age_min: preferences.age_min,
        age_max: preferences.age_max,
        height_min_cm: preferences.height_min_cm,
        height_max_cm: preferences.height_max_cm,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      onComplete()
    } catch (error) {
      console.error('Error saving preferences:', error)
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
            <div className="h-1 w-12 bg-purple-600 rounded-full"></div>
            <div className="h-1 w-12 bg-gray-600 rounded-full"></div>
            <span className="text-gray-400 text-sm ml-2">3/4</span>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Who are you looking to meet?</h2>
            <p className="text-gray-400 text-sm">The better we know your preferences, the better your matches.</p>
          </div>

          <div className="space-y-6">
            {/* Gender & Relationship Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Gender</label>
                <select
                  value={preferences.looking_for_gender}
                  onChange={(e) => setPreferences({ ...preferences, looking_for_gender: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1f1f3a] border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="any">Any</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">Relationship status</label>
                <select
                  value={preferences.looking_for_relationship_status}
                  onChange={(e) => setPreferences({ ...preferences, looking_for_relationship_status: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1f1f3a] border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select...</option>
                  <option value="single">Single</option>
                  <option value="in_relationship">In a Relationship</option>
                  <option value="married">Married</option>
                  <option value="complicated">It's Complicated</option>
                  <option value="any">Any</option>
                </select>
              </div>
            </div>

            {/* Distance Slider */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-gray-300 text-sm">Distance (km)</label>
                <span className="text-white font-semibold">{preferences.distance_km}</span>
              </div>
              <input
                type="range"
                min="1"
                max="500"
                value={preferences.distance_km}
                onChange={(e) => setPreferences({ ...preferences, distance_km: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-purple"
              />
            </div>

            {/* Age Range */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">Age range</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="18"
                  max="100"
                  value={preferences.age_min}
                  onChange={(e) => {
                    const newMin = parseInt(e.target.value)
                    if (newMin < preferences.age_max) {
                      setPreferences({ ...preferences, age_min: newMin })
                    }
                  }}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-purple"
                />
                <span className="text-white font-semibold min-w-[60px] text-center">{preferences.age_min}-{preferences.age_max}</span>
                <input
                  type="range"
                  min="18"
                  max="100"
                  value={preferences.age_max}
                  onChange={(e) => {
                    const newMax = parseInt(e.target.value)
                    if (newMax > preferences.age_min) {
                      setPreferences({ ...preferences, age_max: newMax })
                    }
                  }}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-purple"
                />
              </div>
            </div>

            {/* Height Range */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">Height (cm)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="100"
                  max="250"
                  value={preferences.height_min_cm}
                  onChange={(e) => {
                    const newMin = parseInt(e.target.value)
                    if (newMin < preferences.height_max_cm) {
                      setPreferences({ ...preferences, height_min_cm: newMin })
                    }
                  }}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-purple"
                />
                <span className="text-white font-semibold min-w-[80px] text-center">{preferences.height_min_cm}-{preferences.height_max_cm}</span>
                <input
                  type="range"
                  min="100"
                  max="250"
                  value={preferences.height_max_cm}
                  onChange={(e) => {
                    const newMax = parseInt(e.target.value)
                    if (newMax > preferences.height_min_cm) {
                      setPreferences({ ...preferences, height_max_cm: newMax })
                    }
                  }}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-purple"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !preferences.looking_for_gender || !preferences.looking_for_relationship_status}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors mt-8 mb-4"
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

      <style>{`
        .slider-purple::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #a855f7;
          cursor: pointer;
        }
        .slider-purple::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #a855f7;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}
