import { useState, useEffect } from 'react'
import { supabase } from '../client'
import RelaxConnectMatchCard from './RelaxConnectMatchCard'


type SignupStep = 'email' | 'otp' | 'password'

export default function Signup() {
  const [step, setStep] = useState<SignupStep>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Cleanup signup flag on unmount
  useEffect(() => {
    return () => {
      // Cleanup only if signup is incomplete (not on password step)
      if (step !== 'password') {
        localStorage.removeItem('signup_in_progress')
      }
    }
  }, [step])

  // Handle email submission and send OTP
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreedToTerms) {
      setMessage('Please agree to Terms and Conditions')
      return
    }

    try {
      setIsLoading(true)
      setMessage('')

      // Set signup_in_progress flag for email/OTP flow only
      localStorage.setItem('signup_in_progress', 'true')

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: undefined,
        },
      })
      if (error) throw error
      setStep('otp')
      setMessage('Check your email for the 6-digit verification code')
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
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email',
      })
      if (error) throw error

      console.log('OTP verified, user session:', data.session)

      // Check if user already has a password set
      if (data.session) {
        // User is now logged in, proceed to password setup
        setStep('password')
        setMessage('')
      }
    } catch (error: any) {
      setMessage(error.error_description || error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle password setup
  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters')
      return
    }

    try {
      setIsLoading(true)
      setMessage('')
      const { error } = await supabase.auth.updateUser({
        password: password,
      })
      if (error) throw error

      // Clear signup flag and redirect to home (triggers onboarding)
      localStorage.removeItem('signup_in_progress')
      window.location.href = '/'
    } catch (error: any) {
      setMessage(error.error_description || error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    try {
      setIsLoading(true)
      setMessage('')
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      })
      if (error) throw error
      setMessage('Code resent successfully!')
    } catch (error: any) {
      setMessage(error.error_description || error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle social signup
  const handleSocialSignup = async (provider: 'github' | 'discord') => {
    try {
      setIsLoading(true)
      setMessage('')
      // Remove signup_in_progress flag for OAuth - they don't need password setup
      localStorage.removeItem('signup_in_progress')

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      setMessage(error.error_description || error.message)
    } finally {
      setIsLoading(false)
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

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="w-full max-w-md mx-auto py-4">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <h1 className="text-xl sm:text-2xl font-bold text-white">MATCHCHAYN</h1>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome to Matchchayn</h2>
            <p className="text-gray-400 text-sm">Match with those who vibe on your frequency on-chain.</p>
          </div>

          {/* STEP 1: Email Entry */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-gray-300 text-sm mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dipedej@gmail.com"
                  className="w-full px-4 py-3 bg-transparent border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                  disabled={isLoading}
                />
                <label htmlFor="terms" className="text-xs text-gray-400">
                  Agree with <span className="underline cursor-pointer">Terms and Conditions</span> (18+ Only)
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !agreedToTerms}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors"
              >
                {isLoading ? 'Loading...' : 'Get Started'}
              </button>

              {/* Message */}
              {message && (
                <div className="text-center text-sm text-red-400">
                  {message}
                </div>
              )}

              {/* Login Link */}
              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Already registered on Matchchayn?{' '}
                  <a href="/login" className="text-purple-500 hover:underline">Login</a>
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-700"></div>
                <span className="text-gray-500 text-sm">or continue with</span>
                <div className="flex-1 h-px bg-gray-700"></div>
              </div>

              {/* Social Buttons */}
              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => handleSocialSignup('github')}
                  disabled={isLoading}
                  className="w-14 h-14 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
                  title="Sign up with Github"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#000">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialSignup('discord')}
                  disabled={isLoading}
                  className="w-14 h-14 bg-[#5865F2] rounded-full flex items-center justify-center hover:bg-[#4752C4] transition-colors disabled:opacity-50"
                  title="Sign up with Discord"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#fff">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                  </svg>
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleOtpVerify} className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">You've got mail</h3>
                <p className="text-sm text-gray-400">
                  We have sent the OTP verification code to your email address. Check your email and enter the code below.
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
                    className="w-12 h-14 text-center text-2xl font-bold bg-transparent border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    disabled={isLoading}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.join('').length !== 6}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors"
              >
                {isLoading ? 'Verifying...' : 'Confirm'}
              </button>

              {/* Message */}
              {message && (
                <div className={`text-center text-sm ${message.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                  {message}
                </div>
              )}

              {/* Resend Code */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-sm text-purple-500 hover:underline disabled:opacity-50"
                >
                  Didn't receive code? Resend
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Set Password */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSetup} className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Set Password</h3>
                <p className="text-sm text-gray-400">
                  Set the password for your account so you can login and access all features.
                </p>
              </div>

              <div>
                <label htmlFor="password" className="block text-gray-300 text-sm mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 bg-transparent border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-gray-300 text-sm mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 bg-transparent border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !password || !confirmPassword}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors"
              >
                {isLoading ? 'Setting up...' : 'Get Started'}
              </button>

              {/* Message */}
              {message && (
                <div className="text-center text-sm text-red-400">
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
