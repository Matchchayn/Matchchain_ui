import { useState } from 'react'
import { supabase } from '../client'
import RelaxConnectMatchCard from './RelaxConnectMatchCard'

type ForgotPasswordStep = 'email' | 'otp' | 'newPassword'

export default function ForgotPassword() {
  const [step, setStep] = useState<ForgotPasswordStep>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

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

  // Handle email submission and send OTP
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsLoading(true)
      setMessage('')

      // Send OTP for password reset using recovery flow
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setStep('otp')
      setMessage('Check your inbox. We\'ve sent you an OTP to reset your password.')
    } catch (error: any) {
      setMessage(error.error_description || error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  // Handle OTP verification
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpCode = otp.join('')

    if (otpCode.length !== 6) {
      setMessage('Please enter all 6 digits')
      return
    }

    try {
      setIsLoading(true)
      setMessage('')

      // Verify OTP (recovery type for password reset)
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'recovery',
      })

      if (error) throw error

      // Store the session temporarily so we can update password
      if (data.session) {
        localStorage.setItem('password_reset_in_progress', 'true')
      }

      setStep('newPassword')
      setMessage('')
    } catch (error: any) {
      setMessage(error.error_description || error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle new password submission
  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check all password requirements
    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters')
      return
    }

    if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword)) {
      setMessage('Password must contain 1 capital letter')
      return
    }

    if (!/[0-9]/.test(newPassword)) {
      setMessage('Password must contain 1 number')
      return
    }

    if (!/[^a-zA-Z0-9]/.test(newPassword)) {
      setMessage('Password must contain 1 special letter')
      return
    }

    try {
      setIsLoading(true)
      setMessage('')

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      setMessage('Password reset successfully! Redirecting to login...')

      // Wait 2 seconds to show success message
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Clear the password reset flag
      localStorage.removeItem('password_reset_in_progress')

      // Sign out and immediately redirect (use location.replace to avoid flicker)
      await supabase.auth.signOut()
      window.location.replace('/login')
    } catch (error: any) {
      setMessage(error.error_description || error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0a0a1f]">
      {/* Left Side - Image (Hidden on mobile) */}
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
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <h1 className="text-xl sm:text-2xl font-bold text-white">MATCHCHAYN</h1>
          </div>

          {/* Back Button - Show on OTP and New Password steps */}
          {(step === 'otp' || step === 'newPassword') && (
            <button
              onClick={() => setStep(step === 'otp' ? 'email' : 'otp')}
              className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Back</span>
            </button>
          )}

          {/* STEP 1: Email Input */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Forgot your password?</h2>
                <p className="text-sm text-gray-400">
                  Enter your email to receive a link to reset your password.
                </p>
              </div>

              <div>
                <label htmlFor="email" className="block text-gray-300 text-sm mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full px-4 py-3 bg-transparent border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors"
              >
                {isLoading ? 'Sending...' : 'Reset Password'}
              </button>

              {/* Message */}
              {message && (
                <div className={`text-center text-sm ${message.includes('sent') ? 'text-green-400' : 'text-red-400'}`}>
                  {message}
                </div>
              )}

              {/* Footer */}
              <p className="text-xs text-center text-gray-500">
                By continuing, you agree to matchchayn{' '}
                <a href="#" className="text-purple-500 hover:underline">Terms of service</a> and{' '}
                <a href="#" className="text-purple-500 hover:underline">Privacy Policy</a>.
              </p>
            </form>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleOtpVerify} className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">You've got a mail!</h2>
                <p className="text-sm text-gray-400">
                  Check your inbox. We've sent you an OTP to reset your password to {email}
                </p>
              </div>

              {/* 6 OTP Input Boxes */}
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-transparent border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    disabled={isLoading}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.join('').length !== 6}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors"
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>

              {/* Message */}
              {message && (
                <div className={`text-center text-sm ${message.includes('Successfully') ? 'text-green-400' : 'text-red-400'}`}>
                  {message}
                </div>
              )}

              {/* Footer */}
              <p className="text-xs text-center text-gray-500">
                Didn't receive an email? Check your spam folder.
              </p>
            </form>
          )}

          {/* STEP 3: Create New Password */}
          {step === 'newPassword' && (
            <form onSubmit={handleNewPasswordSubmit} className="space-y-6">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-white mb-2">Create a new password</h2>
                <p className="text-sm text-gray-400">
                  Your new password must be different from previous used passwords.
                </p>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-gray-300 text-sm mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="●●●●●●●●●●●●"
                    className="w-full px-4 py-3 bg-transparent border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex gap-1 flex-1">
                        <div className={`h-1 flex-1 rounded-full ${passwordStrength >= 1 ? getStrengthColor() : 'bg-gray-700'}`}></div>
                        <div className={`h-1 flex-1 rounded-full ${passwordStrength >= 2 ? getStrengthColor() : 'bg-gray-700'}`}></div>
                        <div className={`h-1 flex-1 rounded-full ${passwordStrength >= 3 ? getStrengthColor() : 'bg-gray-700'}`}></div>
                        <div className={`h-1 flex-1 rounded-full ${passwordStrength >= 4 ? getStrengthColor() : 'bg-gray-700'}`}></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Poor</span>
                      <span>Weak</span>
                      <span>Normal</span>
                      <span>Strong</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Password Requirements */}
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Your password must contain the following</p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    {newPassword.length >= 8 ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-gray-500">●</span>
                    )}
                    <span className={newPassword.length >= 8 ? 'text-white' : 'text-gray-400'}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-gray-500">●</span>
                    )}
                    <span className={(/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) ? 'text-white' : 'text-gray-400'}>
                      At least 1 capital letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/[0-9]/.test(newPassword) ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-gray-500">●</span>
                    )}
                    <span className={/[0-9]/.test(newPassword) ? 'text-white' : 'text-gray-400'}>
                      At least 1 number
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/[^a-zA-Z0-9]/.test(newPassword) ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-gray-500">●</span>
                    )}
                    <span className={/[^a-zA-Z0-9]/.test(newPassword) ? 'text-white' : 'text-gray-400'}>
                      At least 1 special letter (!@#$%^&*)
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || passwordStrength < 4}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors"
              >
                {isLoading ? 'Creating...' : 'Create a new password'}
              </button>

              {/* Message */}
              {message && (
                <div className={`text-center text-sm ${message.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                  {message}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
