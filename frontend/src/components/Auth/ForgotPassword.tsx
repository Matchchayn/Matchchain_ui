import React, { useState } from 'react'
import RelaxConnectMatchCard from '../RelaxConnectMatchCard'
// Ensuring clean syntax
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../../config';

type ForgotPasswordStep = 'email' | 'otp' | 'password' | 'success'

export default function ForgotPassword() {
  const [step, setStep] = useState<ForgotPasswordStep>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

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

  const passwordStrength = getPasswordStrength(newPassword)

  const getStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-red-500'
    if (passwordStrength === 1) return 'bg-orange-500'
    if (passwordStrength === 2) return 'bg-yellow-500'
    if (passwordStrength === 3) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const handleResendOtp = async () => {
    try {
      setIsLoading(true)
      setMessage('')
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to resend')
      setMessage('OTP resent successfully!')
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      setMessage('')
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Request failed')
      setStep('otp')
      setMessage('Reset code sent to your email!')
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.join('').length === 4) {
      setStep('password')
      setMessage('')
    } else {
      setMessage('Please enter all 4 digits')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isPasswordValid(newPassword)) {
      setMessage('Password does not meet requirements')
      return
    }

    try {
      setIsLoading(true)
      setMessage('')
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otp.join(''), newPassword }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Reset failed')
      setStep('success')
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0a0a1f]">
      {/* Left Side - Image */}
      <div className="hidden lg:block lg:w-1/2 lg:flex-shrink-0 relative bg-[#0a0a1f]">
        <div className="relative w-full h-full overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop"
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
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src="/favicon.png" alt="MatchChayn" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
            <h1 className="text-2xl font-bold text-white tracking-wider">MatchChayn</h1>
          </div>

          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Forgot Password</h2>
                <p className="text-sm text-gray-400">Enter your email to receive a reset code.</p>
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 bg-transparent border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-semibold rounded-full transition-colors"
              >
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </button>
              {message && <div className="text-center text-sm text-red-400">{message}</div>}
              <div className="text-center">
                <Link to="/login" className="text-sm text-purple-500 hover:underline">Back to Login</Link>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpVerify} className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Verify Code</h2>
                <p className="text-sm text-gray-400">Enter the 4-digit code sent to {email}</p>
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
                    required
                  />
                ))}
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full transition-colors"
              >
                Verify Code
              </button>
              <div className="text-center space-y-4">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-sm text-purple-500 hover:underline disabled:text-gray-500"
                >
                  {isLoading ? 'Sending...' : 'Resend Code'}
                </button>
                <div>
                  <button type="button" onClick={() => setStep('email')} className="text-sm text-gray-400 hover:underline">Change Email</button>
                </div>
              </div>
              {message && (
                <div className={`text-center text-sm ${message.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                  {message}
                </div>
              )}
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">New Password</h2>
                <p className="text-sm text-gray-400">Set your new password below.</p>
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
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
                {newPassword && (
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
                  <Requirement met={newPassword.length >= 8} text="Min 8 characters" />
                  <Requirement met={/[A-Z]/.test(newPassword)} text="At least 1 uppercase" />
                  <Requirement met={/[0-9]/.test(newPassword)} text="At least 1 number" />
                  <Requirement met={/[^a-zA-Z0-9]/.test(newPassword)} text="At least 1 special character" />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || !isPasswordValid(newPassword)}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-semibold rounded-full transition-colors"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
              {message && <div className="text-center text-sm text-red-400">{message}</div>}
            </form>
          )}

          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white">Password Reset!</h2>
              <p className="text-gray-400">Your password has been successfully updated.</p>
              <Link
                to="/login"
                className="block w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-full transition-colors text-center"
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
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
