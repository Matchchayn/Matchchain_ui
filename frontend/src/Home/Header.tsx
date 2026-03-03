import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import WalletButton from '../components/WalletButton'
import { fetchUserProfile } from '../utils/userProfileService'
import NotificationModal from '../components/NotificationModal'
import { useAlert } from '../hooks/useAlert'
import { API_BASE_URL } from '../config';

interface HeaderProps {
  userId?: string
}

const userDataCache = new Map<string, { avatarUrl: string | null }>()

export default function Header({ userId }: HeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [balance, setBalance] = useState<number>(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const hasFetched = useRef(false)
  const dropdownRef = useRef<HTMLDivElement>(null)



  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token && !hasFetched.current) {
      fetchUserAvatar()
    }
  }, [userId])

  const fetchUserAvatar = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const data = await fetchUserProfile(token)
      if (data) {
        setAvatarUrl(data.avatarUrl || null)
        if (userId) userDataCache.set(userId, { avatarUrl: data.avatarUrl || null })
        hasFetched.current = true
      }
    } catch (err) { }
  }

  useEffect(() => {
    const fetchBalance = async () => {
      if (connected && publicKey && connection) {
        try {
          const balance = await connection.getBalance(publicKey)
          setBalance(balance / LAMPORTS_PER_SOL)
        } catch { setBalance(0) }
      } else {
        setBalance(0)
      }
    }
    fetchBalance()
    const interval = setInterval(fetchBalance, 10000)

    const checkNotifications = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        const res = await fetch(`${API_BASE_URL}/api/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setHasUnread(data.some((n: any) => !n.isRead))
        }
      } catch { }
    }
    checkNotifications()
    const notifInterval = setInterval(checkNotifications, 30000)
    return () => { clearInterval(interval); clearInterval(notifInterval) }
  }, [connected, publicKey, connection])

  const { showAlert } = useAlert()
  const handleSignOut = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('session')
    showAlert('Signed out successfully', 'success')
    setTimeout(() => {
      window.location.href = '/login'
    }, 500)
  }



  return (
    <>
      <header className="fixed top-[var(--connectivity-height,0px)] left-0 right-0 z-50 bg-[#090a1e] backdrop-blur-md border-b border-purple-500/20 transition-all duration-300">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Hamburger (mobile) + Logo */}
            <div className="flex items-center gap-3">
              {/* Hamburger - mobile only */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 -ml-2 hover:bg-purple-600/20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logo */}
              <div className="flex items-center gap-2">
                <img src="/matchlogo.png" alt="Matchchayn" className="w-8 h-8 object-contain" />
                <h1 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-wider italic">MatchChayn</h1>
              </div>
            </div>

            {/* Center - Explore Matches (desktop only) */}
            <div className="hidden lg:block text-white/80 font-medium">
              Explore Matches
            </div>

            {/* Right side buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {connected && publicKey && (
                <div className="hidden xs:flex items-center gap-2 px-2 py-1.5 sm:px-4 sm:py-2 bg-[#090a1e] rounded-full border border-purple-500/30">
                  <span className="text-white text-xs sm:text-sm font-semibold">SOL</span>
                  <span className="text-purple-400 text-xs sm:text-sm font-bold">{balance.toFixed(2)}</span>
                </div>
              )}

              <div className="hidden sm:block">
                <WalletButton />
              </div>

              {/* Notification Bell */}
              <button
                onClick={() => { setIsNotificationsOpen(true); setHasUnread(false) }}
                className="relative p-2 hover:bg-purple-600/20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {hasUnread && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#0a0a1f]"></div>
                )}
              </button>

              {/* Profile Picture with dropdown - hidden on mobile (accessible in sidebar) */}
              <div className="relative hidden sm:block" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 hover:bg-purple-600/20 rounded-full pr-3 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-purple-600/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <svg className={`w-4 h-4 text-white transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#090a1e] border border-purple-500/20 rounded-xl overflow-hidden shadow-xl shadow-black/30 z-50">
                    <button onClick={() => { setDropdownOpen(false); navigate('/profile') }} className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-purple-600/20 transition-colors text-sm">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Profile
                    </button>
                    <div className="border-t border-purple-500/10" />
                    <button onClick={() => { setDropdownOpen(false); handleSignOut() }} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors text-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <NotificationModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          token={localStorage.getItem('token') || ''}
        />
      </header>

      {/* ─── Mobile Sidebar Drawer ─── */}
      {mobileMenuOpen && createPortal(
        <div className="fixed inset-0 z-[200] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sidebar Panel */}
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#0d0e24] border-r border-purple-500/20 flex flex-col animate-in slide-in-from-left duration-300 shadow-2xl shadow-black/50">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-5 border-b border-purple-500/10">
              <div className="flex items-center gap-2.5">
                <img src="/matchlogo.png" alt="Matchchayn" className="w-7 h-7 object-contain" />
                <span className="text-white font-bold text-xl uppercase tracking-wider italic">MatchChayn</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User profile mini card */}
            <div className="px-5 py-4 border-b border-purple-500/10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-purple-500/30">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-purple-600/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">My Profile</p>
                  <p className="text-purple-400/60 text-[10px] tracking-widest font-bold">Online</p>
                </div>
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Bottom: Wallet + Logout */}
            <div className="px-3 py-4 border-t border-purple-500/10 space-y-2">
              <div className="px-4">
                <WalletButton />
              </div>
              <button
                onClick={() => { handleSignOut(); setMobileMenuOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-red-400 rounded-xl hover:bg-red-500/10 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium text-sm">Log out</span>
              </button>
            </div>
          </aside>
        </div>,
        document.body
      )}
    </>
  )
}
