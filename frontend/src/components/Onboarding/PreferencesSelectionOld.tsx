import { useState } from 'react'
import { supabase } from '../../client'
import type { Session } from '@supabase/supabase-js'

interface PreferencesSelectionProps {
  session: Session
  onComplete: () => void
  onBack: () => void
}

export default function PreferencesSelection({ session, onComplete, onBack }: PreferencesSelectionProps) {
  const [loading, setLoading] = useState(false)

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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f0f23',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>MATCHCHAYN</h1>
          <div style={{ marginBottom: '20px', color: '#9ca3af' }}>
            <span style={{ backgroundColor: '#8b5cf6', padding: '2px 8px', borderRadius: '12px', marginRight: '5px' }}>━</span>
            <span style={{ backgroundColor: '#8b5cf6', padding: '2px 8px', borderRadius: '12px', marginRight: '5px' }}>━</span>
            <span style={{ backgroundColor: '#8b5cf6', padding: '2px 8px', borderRadius: '12px', marginRight: '5px' }}>━</span>
            <span style={{ backgroundColor: '#4b5563', padding: '2px 8px', borderRadius: '12px', marginRight: '5px' }}>━</span>
            <span style={{ marginLeft: '5px' }}>3/4</span>
          </div>
          <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>Who are you</h2>
          <h2 style={{ fontSize: '32px', marginBottom: '10px' }}>looking to meet?</h2>
          <p style={{ color: '#9ca3af', marginBottom: '30px' }}>
            The better we know your preferences,<br />the better your matches.
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '16px' }}>Gender</label>
              <select
                value={preferences.looking_for_gender}
                onChange={(e) => setPreferences({ ...preferences, looking_for_gender: e.target.value })}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid #4b5563',
                  backgroundColor: '#1f1f3a',
                  color: 'white',
                  fontSize: '16px'
                }}
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="any">Any</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '16px' }}>Relationship status</label>
              <select
                value={preferences.looking_for_relationship_status}
                onChange={(e) => setPreferences({ ...preferences, looking_for_relationship_status: e.target.value })}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid #4b5563',
                  backgroundColor: '#1f1f3a',
                  color: 'white',
                  fontSize: '16px'
                }}
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
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <label style={{ fontSize: '16px' }}>Distance (km)</label>
              <span style={{ fontSize: '16px', fontWeight: '600' }}>{preferences.distance_km}</span>
            </div>
            <input
              type="range"
              min="1"
              max="500"
              value={preferences.distance_km}
              onChange={(e) => setPreferences({ ...preferences, distance_km: parseInt(e.target.value) })}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(preferences.distance_km / 500) * 100}%, #4b5563 ${(preferences.distance_km / 500) * 100}%, #4b5563 100%)`,
                outline: 'none',
                appearance: 'none'
              }}
            />
          </div>

          {/* Age Range */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '16px' }}>Age range</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>Min (18-100)</label>
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={preferences.age_min}
                  onChange={(e) => {
                    const newMin = parseInt(e.target.value) || 18
                    if (newMin >= 18 && newMin <= 100 && newMin < preferences.age_max) {
                      setPreferences({ ...preferences, age_min: newMin })
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid #4b5563',
                    backgroundColor: '#1f1f3a',
                    color: 'white',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>Max (18-100)</label>
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={preferences.age_max}
                  onChange={(e) => {
                    const newMax = parseInt(e.target.value) || 100
                    if (newMax >= 18 && newMax <= 100 && newMax > preferences.age_min) {
                      setPreferences({ ...preferences, age_max: newMax })
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid #4b5563',
                    backgroundColor: '#1f1f3a',
                    color: 'white',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Height Range */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '16px' }}>Height (cm)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>Min (100-250)</label>
                <input
                  type="number"
                  min="100"
                  max="250"
                  value={preferences.height_min_cm}
                  onChange={(e) => {
                    const newMin = parseInt(e.target.value) || 100
                    if (newMin >= 100 && newMin <= 250 && newMin < preferences.height_max_cm) {
                      setPreferences({ ...preferences, height_min_cm: newMin })
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid #4b5563',
                    backgroundColor: '#1f1f3a',
                    color: 'white',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#9ca3af' }}>Max (100-250)</label>
                <input
                  type="number"
                  min="100"
                  max="250"
                  value={preferences.height_max_cm}
                  onChange={(e) => {
                    const newMax = parseInt(e.target.value) || 250
                    if (newMax >= 100 && newMax <= 250 && newMax > preferences.height_min_cm) {
                      setPreferences({ ...preferences, height_max_cm: newMax })
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid #4b5563',
                    backgroundColor: '#1f1f3a',
                    color: 'white',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onBack}
            disabled={loading}
            style={{
              padding: '16px 24px',
              borderRadius: '28px',
              border: '2px solid #4b5563',
              backgroundColor: 'transparent',
              color: 'white',
              fontSize: '18px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Previous
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '28px',
              border: 'none',
              backgroundColor: '#8b5cf6',
              color: 'white',
              fontSize: '18px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </div>

        <style>{`
          input[type="range"] {
            -webkit-appearance: none;
          }
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            border: 2px solid #8b5cf6;
          }
          input[type="range"]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            border: 2px solid #8b5cf6;
          }
          input[type="number"]::-webkit-inner-spin-button,
          input[type="number"]::-webkit-outer-spin-button {
            opacity: 1;
          }
        `}</style>
      </div>
    </div>
  )
}
