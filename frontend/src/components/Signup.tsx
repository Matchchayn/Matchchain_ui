import { useState, useEffect } from 'react'
import { supabase } from '../client'
import RelaxConnectMatchCard from './RelaxConnectMatchCard'


type SignupStep = 'email' | 'otp' | 'password'

export default function Signup() {
  const [step, setStep] = useState<SignupStep>(() => {
    // Restore step from localStorage if user is in password setup
    const needsPassword = localStorage.getItem('signup_needs_password')
    return needsPassword === 'true' ? 'password' : 'email'
  })
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('signup_email') || ''
  })
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
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

  const passwordStrength = getPasswordStrength(password)

  const getStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-red-500'
    if (passwordStrength === 1) return 'bg-orange-500'
    if (passwordStrength === 2) return 'bg-yellow-500'
    if (passwordStrength === 3) return 'bg-blue-500'
    return 'bg-green-500'
  }

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
      localStorage.setItem('signup_email', email)

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: undefined,
        },
      })

      if (error) throw error

      // Check if this created a new user or is an existing user
      // Supabase will send OTP to new users and magic link to existing users
      // We can't reliably prevent this on the client side, but we can inform the user

      setStep('otp')
      setMessage('Check your email for the 6-digit verification code')
    } catch (error: any) {
      localStorage.removeItem('signup_in_progress')
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

      // Ensure the signup_in_progress flag is set BEFORE verifying OTP
      localStorage.setItem('signup_in_progress', 'true')
      localStorage.setItem('signup_needs_password', 'true')

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email',
      })
      if (error) throw error

      console.log('OTP verified, user session:', data.session)

      // User is now logged in, proceed to password setup
      if (data.session) {
        console.log('Setting step to password')
        setStep('password')
        setMessage('')
      } else {
        console.error('No session after OTP verification')
        setMessage('Verification failed. Please try again.')
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

    // Check all password requirements
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters')
      return
    }

    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
      setMessage('Password must contain 1 capital letter')
      return
    }

    if (!/[0-9]/.test(password)) {
      setMessage('Password must contain 1 number')
      return
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
      setMessage('Password must contain 1 special letter')
      return
    }

    try {
      setIsLoading(true)
      setMessage('')
      const { error } = await supabase.auth.updateUser({
        password: password,
      })
      if (error) throw error

      // Show success message briefly before redirecting
      setMessage('Password set successfully! Starting onboarding...')

      // Small delay to ensure password is saved
      await new Promise(resolve => setTimeout(resolve, 500))

      // Clear only the password-related flags, keep signup_in_progress until onboarding is done
      localStorage.removeItem('signup_needs_password')
      localStorage.removeItem('signup_email')
      // Don't remove signup_in_progress yet - it will be removed after onboarding completes

      // Force reload to trigger onboarding
      window.location.reload()
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
  const handleSocialSignup = async (provider: 'apple' | 'discord') => {
    try {
      setIsLoading(true)
      setMessage('')
      // Keep signup_in_progress flag for OAuth - they will go through onboarding
      localStorage.setItem('signup_in_progress', 'true')

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
          skipBrowserRedirect: false,
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

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-md">
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
                  onClick={() => handleSocialSignup('apple')}
                  disabled={isLoading}
                  className="w-14 h-14 bg-black rounded-full flex items-center justify-center hover:bg-gray-900 transition-colors disabled:opacity-50"
                  title="Sign up with Apple"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#fff">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
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
            <form onSubmit={handlePasswordSetup} className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-white mb-2">Set Password</h3>
                <p className="text-sm text-gray-400">
                  Secure your account by setting a password you'll remember.
                </p>
              </div>

              <div>
                <label htmlFor="password" className="block text-gray-300 text-sm mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                {password && (
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
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    {password.length >= 8 ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-gray-500">●</span>
                    )}
                    <span className={password.length >= 8 ? 'text-white' : 'text-gray-400'}>
                      Minimum of 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(/[a-z]/.test(password) && /[A-Z]/.test(password)) ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-gray-500">●</span>
                    )}
                    <span className={(/[a-z]/.test(password) && /[A-Z]/.test(password)) ? 'text-white' : 'text-gray-400'}>
                      Contains 1 capital letter
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/[0-9]/.test(password) ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-gray-500">●</span>
                    )}
                    <span className={/[0-9]/.test(password) ? 'text-white' : 'text-gray-400'}>
                      Contains 1 number
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/[^a-zA-Z0-9]/.test(password) ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-gray-500">●</span>
                    )}
                    <span className={/[^a-zA-Z0-9]/.test(password) ? 'text-white' : 'text-gray-400'}>
                      Contains 1 special letter
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || passwordStrength < 4}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors"
              >
                {isLoading ? 'Setting up...' : 'Set Password'}
              </button>

              {/* Message */}
              {message && (
                <div className={`text-center text-sm ${message.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                  {message}
                </div>
              )}

              {/* Terms */}
              <p className="text-xs text-center text-gray-500">
                By continuing, you agree to matchchayn{' '}
                <a href="#" className="text-purple-500 hover:underline">Terms of service</a> and{' '}
                <a href="#" className="text-purple-500 hover:underline">Privacy Policy</a>.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
