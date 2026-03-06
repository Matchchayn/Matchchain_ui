import React, { useState } from 'react'
import { clearProfileCache } from '../../utils/userProfileService'
// Ensuring clean syntax to prevent Vite reload issues
import RelaxConnectMatchCard from '../RelaxConnectMatchCard'
import onboardingstock from '../../assets/onboardingstock.jpg'
import { Link } from 'react-router-dom'
import GoogleAuth from './third_party_auth/GoogleAuth'
import { useAlert } from '../../hooks/useAlert'
import { API_BASE_URL } from '../../config';
import { safeLocalStorageSet } from '../../utils/storageUtils';
import TermsModal from './TermsModal';

type SignupStep = 'email' | 'otp' | 'password'

interface SignupProps {
  onSignupSuccess?: () => void
}

export default function Signup({ onSignupSuccess }: SignupProps) {
  const { showAlert } = useAlert()
  const [step, setStep] = useState<SignupStep>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', ''])
  const [password, setPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  // Password requirements check
  const isPasswordValid = (pwd: string) => {
    return pwd.length >= 8 &&
      /[a-z]/.test(pwd) &&
      /[A-Z]/.test(pwd) &&
      /[0-9]/.test(pwd) &&
      /[^a-zA-Z0-9]/.test(pwd)
  }

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(password)

  const getStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-red-500'
    if (passwordStrength === 1) return 'bg-orange-500'
    if (passwordStrength === 2) return 'bg-yellow-500'
    if (passwordStrength === 3) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const handleAuthSuccess = () => {
    showAlert('Signup successful! Starting onboarding...', 'success')
    localStorage.setItem('isSignupFlow', 'true')
    if (onSignupSuccess) {
      onSignupSuccess()
    } else {
      window.location.href = '/'
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreedToTerms) {
      showAlert('Please agree to Terms and Conditions', 'warning')
      return
    }

    try {
      setIsLoading(true)

      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to send OTP')

      setStep('otp')
      showAlert('OTP sent to your email!', 'success')
    } catch (error: any) {
      showAlert(error.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpCode = otp.join('')

    if (otpCode.length !== 4) {
      showAlert('Please enter all 4 digits', 'warning')
      return
    }

    try {
      setIsLoading(true)

      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Invalid OTP')

      setStep('password')
      showAlert('OTP verified successfully!', 'success')
    } catch (error: any) {
      showAlert(error.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to resend')
      showAlert('OTP sent successfully!', 'success')
    } catch (error: any) {
      showAlert(error.message, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isPasswordValid(password)) {
      showAlert('Please ensure all password requirements are met.', 'warning')
      return
    }

    try {
      setIsLoading(true)

      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, otp: otp.join('') }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Signup failed')

      console.log('[Signup] Success! Clearing old caches...');
      clearProfileCache()

      console.log('[Signup] Saving new session...');
      safeLocalStorageSet('token', data.token);
      safeLocalStorageSet('user', data.user);

      handleAuthSuccess()
    } catch (error: any) {
      showAlert(error.message, 'error')
    } finally {
      setIsLoading(false)
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
            <img src="/favicon.png" alt="MatchChayn" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wider">MatchChayn</h1>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome to MatchChayn</h2>
            <p className="text-gray-400 text-sm">Match with those who vibe on your frequency on-chain.</p>
          </div>

          {step === 'email' && (
            <div className="space-y-4">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-gray-300 text-sm mb-2">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 bg-transparent border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded border flex flex-shrink-0 items-center justify-center cursor-pointer transition-colors ${isLoading ? 'opacity-50 pointer-events-none' : ''} ${agreedToTerms ? 'bg-purple-600 border-purple-600' : 'border-gray-500 hover:border-purple-400'}`}
                    onClick={() => {
                      if (!isLoading) {
                        if (!agreedToTerms) {
                          setShowTerms(true);
                        } else {
                          setAgreedToTerms(false);
                        }
                      }
                    }}
                  >
                    {agreedToTerms && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <label className="text-sm text-gray-400">
                    I agree to the <span className="text-purple-400 hover:text-purple-300 underline cursor-pointer" onClick={() => !isLoading && setShowTerms(true)}>Terms and Conditions</span> (18+ Only)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email || !agreedToTerms}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors"
                >
                  {isLoading ? 'Loading...' : 'Get Started'}
                </button>
              </form>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-400">
                  Already registered? <Link to="/login" className="text-purple-500 hover:underline cursor-pointer">Login</Link>
                </p>
                <div className="pt-1">
                  <Link to="/privacy-policy" className="text-xs text-gray-500 hover:text-purple-400 transition-colors">
                    Privacy Policy
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-700"></div>
                <span className="text-gray-500 text-sm">or</span>
                <div className="flex-1 h-px bg-gray-700"></div>
              </div>

              <div className="flex justify-center">
                <GoogleAuth
                  onSuccess={handleAuthSuccess}
                  setIsLoading={setIsLoading}
                  onBeforeLogin={() => {
                    if (!agreedToTerms) {
                      showAlert('Please agree to Terms and Conditions', 'warning')
                      return false
                    }
                    return true
                  }}
                />
              </div>
            </div>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpVerify} className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Verify Email</h3>
                <p className="text-sm text-gray-400">Sent a 4-digit code to {email}</p>
              </div>

              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold bg-transparent border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    disabled={isLoading}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.join('').length !== 4}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full transition-colors"
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-sm text-purple-500 hover:underline"
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSetup} className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-white mb-2">Set Password</h3>
                <p className="text-sm text-gray-400">Secure your account with a password.</p>
              </div>

              <div>
                <label htmlFor="password" className="block text-gray-300 text-sm mb-2">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-3">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((s) => (
                        <div key={s} className={`h-1 flex-1 rounded-full ${passwordStrength >= s ? getStrengthColor() : 'bg-gray-800'}`}></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Password Requirements */}
              <div className="space-y-2">
                <p className="text-xs text-gray-400">Requirements:</p>
                <div className="grid grid-cols-1 gap-1 text-[10px]">
                  <Requirement met={password.length >= 8} text="Min 8 characters" />
                  <Requirement met={/[A-Z]/.test(password)} text="At least 1 uppercase" />
                  <Requirement met={/[0-9]/.test(password)} text="At least 1 number" />
                  <Requirement met={/[^a-zA-Z0-9]/.test(password)} text="At least 1 special character" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !isPasswordValid(password)}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-semibold rounded-full transition-colors"
                title={!isPasswordValid(password) ? "Please meet all password requirements" : ""}
              >
                {isLoading ? 'Completing...' : 'Complete Signup'}
              </button>
            </form>
          )}

        </div>
      </div>

      <TermsModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={() => setAgreedToTerms(true)}
      />
    </div>
  )
}

function Requirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={met ? 'text-green-500' : 'text-gray-600'}>{met ? '✓' : '•'}</span>
      <span className={met ? 'text-gray-300' : 'text-gray-500'}>{text}</span>
    </div>
  )
}
