import React, { useState } from 'react'
import { clearProfileCache } from '../../utils/userProfileService'
import RelaxConnectMatchCard from '../RelaxConnectMatchCard'
import onboardingstock from '../../assets/onboardingstock.jpg'
import { Link } from 'react-router-dom'
import GoogleAuth from './third_party_auth/GoogleAuth'
import { useAlert } from '../../hooks/useAlert'
import { API_BASE_URL } from '../../config';

interface LoginProps {
  onLoginSuccess?: () => void
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const { showAlert } = useAlert()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Login failed')

      // Save token and user info
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      clearProfileCache()
      localStorage.removeItem('isSignupFlow')

      showAlert('Signed in successfully', 'success')

      // Trigger session check instead of full reload
      if (onLoginSuccess) {
        onLoginSuccess()
      } else {
        window.location.href = '/'
      }
    } catch (error: any) {
      showAlert(error.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAuthSuccess = () => {
    localStorage.removeItem('isSignupFlow')
    if (onLoginSuccess) {
      onLoginSuccess()
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#090a1e]">
      {/* Left Side - Image (Hidden on mobile) */}
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

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <h1 className="text-xl sm:text-2xl font-bold text-white">MATCHCHAYN</h1>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome to Matchchayn</h2>
            <p className="text-gray-400 text-sm">Match with those who vibe on your frequency on-chain.</p>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-3 mb-4">
            <div>
              <label htmlFor="email" className="block text-gray-300 text-sm mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full px-4 py-3 bg-transparent border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-300 text-sm mb-2">
                Your Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-4 py-3 bg-transparent border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors"
            >
              {isLoading ? 'Loading...' : 'Sign in'}
            </button>
          </form>


          {/* Links */}
          <div className="text-center space-y-2 mb-4">
            <Link to="/forgot-password" title="Forgot your password?" className="block text-sm text-purple-500 hover:underline cursor-pointer">
              Forgot your password?
            </Link>
            <p className="text-sm text-gray-400">
              Don't have an account? <Link to="/signup" className="text-purple-500 hover:underline cursor-pointer">Sign up</Link>
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-gray-700"></div>
            <span className="text-gray-500 text-sm">or continue with</span>
            <div className="flex-1 h-px bg-gray-700"></div>
          </div>

          {/* Social Login Buttons */}
          <div className="flex justify-center">
            <GoogleAuth
              onSuccess={handleAuthSuccess}
              setIsLoading={setIsLoading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
