import React, { useState, useEffect } from 'react'
import { clearProfileCache } from '../../utils/userProfileService'
import RelaxConnectMatchCard from '../RelaxConnectMatchCard'
import onboardingstock from '../../assets/onboardingstock.jpg'

import CustomDropdown from '../Common/CustomDropdown'

import { useAlert } from '../../hooks/useAlert'
import { API_BASE_URL } from '../../config';

interface ProfileCreationProps {
  session: any
  onComplete: () => void
  onBack?: () => void
}

export default function ProfileCreation({ session, onComplete, onBack }: ProfileCreationProps) {
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

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    dateOfBirth: '',
    country: '',
    city: '',
    gender: '',
    relationshipStatus: '',
    bio: ''
  })

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ]

  const statusOptions = [
    { value: 'single', label: 'Single' },
    { value: 'in_relationship', label: 'In a Relationship' },
    { value: 'married', label: 'Married' },
    { value: 'complicated', label: "It's Complicated" }
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.firstName || !formData.lastName || !formData.username || !formData.dateOfBirth || !formData.gender || !formData.relationshipStatus) {
      showAlert('Please fill in all required fields.', 'warning')
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to save profile')

      clearProfileCache()
      showAlert('Profile created successfully!', 'success')
      onComplete()
    } catch (error: any) {
      showAlert(error.message, 'error')
      console.error('Error creating profile:', error)
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
      <div className="w-full lg:w-1/2 flex flex-col bg-[#090a1e] lg:overflow-y-auto">
        <div className="w-full max-w-md mx-auto px-4 py-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src="/favicon.png" alt="MatchChayn" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
            <h1 className="text-2xl font-bold tracking-widest">MatchChayn</h1>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-1 flex-1 bg-purple-600 rounded-full"></div>
            <div className="h-1 flex-1 bg-gray-800 rounded-full"></div>
            <div className="h-1 flex-1 bg-gray-800 rounded-full"></div>
            <div className="h-1 flex-1 bg-gray-800 rounded-full"></div>
            <span className="text-gray-400 text-xs ml-2 font-mono">1/4</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-3">Welcome</h2>
            <p className="text-gray-400 text-base">Complete your profile to meet your matches.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-[10px] font-mono uppercase tracking-widest mb-2 px-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#16162d] border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-[10px] font-mono uppercase tracking-widest mb-2 px-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#16162d] border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-[10px] font-mono uppercase tracking-widest mb-2 px-1">Public Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-[#16162d] border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-gray-400 text-[10px] font-mono uppercase tracking-widest mb-2 px-1">Birthday</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#16162d] border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                />
              </div>
              <CustomDropdown
                label="Gender"
                options={genderOptions}
                value={formData.gender}
                onChange={(val) => setFormData({ ...formData, gender: val })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-[10px] font-mono uppercase tracking-widest mb-2 px-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#16162d] border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-[10px] font-mono uppercase tracking-widest mb-2 px-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-[#16162d] border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <CustomDropdown
              label="Status"
              options={statusOptions}
              value={formData.relationshipStatus}
              onChange={(val) => setFormData({ ...formData, relationshipStatus: val })}
            />

            <div>
              <label className="block text-gray-400 text-xs font-mono uppercase mb-2">Express Yourself (Bio)</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                placeholder="What makes your frequency unique?"
                className="w-full px-4 py-3 bg-[#16162d] border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />
            </div>


            <div className="pt-4 flex gap-4">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-full transition-all active:scale-[0.98]"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-bold rounded-full transition-all active:scale-[0.98]"
              >
                {loading ? 'Creating Identity...' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
