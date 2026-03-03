import React, { useState, useEffect } from 'react'
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
  const [lastLoginMethod, setLastLoginMethod] = useState<'email' | 'google' | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('lastLoginMethod') as 'email' | 'google' | null
    setLastLoginMethod(saved)
  }, [])

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

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('lastLoginMethod', 'email')
      clearProfileCache()
      localStorage.removeItem('isSignupFlow')

      showAlert('Signed in successfully', 'success')

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
    localStorage.setItem('lastLoginMethod', 'google')
    localStorage.removeItem('isSignupFlow')
    if (onLoginSuccess) {
      onLoginSuccess()
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#090a1e]">
      {/* Left Side - Image */}
      <div className="hidden lg:block lg:w-1/2 lg:flex-shrink-0 relative bg-[#090a1e]">
        <div className="relative w-full h-full overflow-hidden">
          <img src={onboardingstock} alt="Woman smiling" className="absolute inset-0 w-full h-full object-cover" />
          <RelaxConnectMatchCard />
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
            <img src="/favicon.png" alt="Matchchayn" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wider">MATCHCHAYN</h1>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome to Matchchayn</h2>
            <p className="text-gray-400 text-sm">Match with those who vibe on your frequency on-chain.</p>
          </div>

          {/* Recently Used Banner */}
          {lastLoginMethod && (
            <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/10 border border-purple-500/20">
              <span className="text-purple-400 flex-shrink-0">
                {lastLoginMethod === 'google' ? (
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
              </span>
              <p className="text-xs text-purple-300 font-medium">
                Last signed in with <span className="font-bold">{lastLoginMethod === 'google' ? 'Google' : 'Email & Password'}</span>
              </p>
              <span className="ml-auto flex-shrink-0 text-[10px] bg-purple-600/40 text-purple-300 rounded-full px-2 py-0.5 font-bold uppercase tracking-wider">Last used</span>
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label htmlFor="email" className="text-gray-300 text-sm">Email address</label>
                {lastLoginMethod === 'email' && (
                  <span className="text-[10px] bg-purple-600/30 text-purple-400 rounded-full px-2 py-0.5 font-bold uppercase tracking-wider">Last used</span>
                )}
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className={`w-full px-4 py-3 bg-transparent border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${lastLoginMethod === 'email' ? 'border-purple-500/60 focus:border-purple-400' : 'border-purple-500/30 focus:border-purple-500'}`}
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-300 text-sm mb-2">Your Password</label>
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
          <div className="text-center space-y-2 mb-6">
            <Link to="/forgot-password" className="block text-sm text-purple-500 hover:underline cursor-pointer">
              Forgot your password?
            </Link>
            <p className="text-sm text-gray-400">
              Don't have an account? <Link to="/signup" className="text-purple-500 hover:underline cursor-pointer">Sign up</Link>
            </p>
            <div className="pt-2">
              <Link to="/privacy-policy" className="text-xs text-gray-500 hover:text-purple-400 transition-colors">Privacy Policy</Link>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-700"></div>
            <span className="text-gray-500 text-sm">or continue with</span>
            <div className="flex-1 h-px bg-gray-700"></div>
          </div>

          {/* Social Login Buttons */}
          <div className="flex justify-center items-center gap-3">
            <div className="relative">
              <GoogleAuth
                onSuccess={handleAuthSuccess}
                setIsLoading={setIsLoading}
              />
              {lastLoginMethod === 'google' && (
                <span className="absolute -top-2 -right-2 text-[9px] bg-purple-600 text-white rounded-full px-1.5 py-0.5 font-black uppercase tracking-wider whitespace-nowrap shadow-lg">
                  Last used
                </span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
