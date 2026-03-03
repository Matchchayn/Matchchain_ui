import { useWallet } from '@solana/wallet-adapter-react'
import type { WalletName } from '@solana/wallet-adapter-base'
import { useState } from 'react'
import { createPortal } from 'react-dom'

export default function WalletButton() {
  const { wallets, select, connected, disconnect, publicKey, connecting } = useWallet()
  const [showModal, setShowModal] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const handleConnect = async (walletName: WalletName) => {
    try {
      select(walletName)
      setShowModal(false)
    } catch (error) {
      console.error('Error connecting wallet:', error)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  if (connected && publicKey) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-full transition-colors"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          <span className="text-white text-xs sm:text-sm font-medium">
            {formatAddress(publicKey.toBase58())}
          </span>
          <svg className={`w-4 h-4 text-purple-300 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-[#090a1e] border border-purple-500/20 rounded-xl overflow-hidden shadow-xl shadow-black/30 z-[100]">
            <div className="px-4 py-3 text-left">
              <p className="text-xs text-gray-400 font-medium">Connected to</p>
              <p className="text-sm text-white font-mono mt-0.5 break-all">
                {formatAddress(publicKey.toBase58())}
              </p>
            </div>
            <div className="border-t border-purple-500/10" />
            <button
              onClick={() => {
                handleDisconnect()
                setShowDropdown(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Disconnect
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={connecting}
        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-full transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
      >
        <span>{connecting ? 'Connecting...' : 'Connect wallet'}</span>
        <span className="bg-white/20 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase">Soon</span>
      </button>

      {/* Wallet Selection Modal - Rendered as Portal */}
      {showModal && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[#1a1a2e] rounded-lg p-6 max-w-md w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-xl font-bold">Connect Wallet</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {wallets.filter(wallet => wallet.readyState === 'Installed' || wallet.readyState === 'Loadable').map((wallet) => (
                <button
                  key={wallet.adapter.name}
                  onClick={() => handleConnect(wallet.adapter.name)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-purple-600/10 rounded-xl transition-all"
                >
                  <img
                    src={wallet.adapter.icon}
                    alt={wallet.adapter.name}
                    className="w-8 h-8"
                  />
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">{wallet.adapter.name}</p>
                    {wallet.readyState === 'Installed' && (
                      <p className="text-green-400 text-xs">Detected</p>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}

              {wallets.filter(wallet => wallet.readyState === 'NotDetected').length > 0 && (
                <>
                  <div className="border-t border-purple-500/20 my-4"></div>
                  <p className="text-gray-400 text-sm mb-3">Available Wallets</p>
                  {wallets.filter(wallet => wallet.readyState === 'NotDetected').map((wallet) => (
                    <button
                      key={wallet.adapter.name}
                      onClick={() => window.open(wallet.adapter.url, '_blank')}
                      className="w-full flex items-center gap-4 p-4 hover:bg-purple-600/5 rounded-xl transition-all"
                    >
                      <img
                        src={wallet.adapter.icon}
                        alt={wallet.adapter.name}
                        className="w-8 h-8 opacity-60"
                      />
                      <div className="flex-1 text-left">
                        <p className="text-white/60 font-medium">{wallet.adapter.name}</p>
                        <p className="text-gray-500 text-xs">Not installed</p>
                      </div>
                      <svg className="w-5 h-5 text-purple-400/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  ))}
                </>
              )}
            </div>

            <p className="text-gray-500 text-xs text-center mt-6">
              By connecting your wallet, you agree to our Terms of Service
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
