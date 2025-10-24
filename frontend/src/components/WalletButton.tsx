import { useWallet } from '@solana/wallet-adapter-react'
import type { WalletName } from '@solana/wallet-adapter-base'
import { useState } from 'react'
import { createPortal } from 'react-dom'

export default function WalletButton() {
  const { wallets, select, connected, disconnect, publicKey, connecting } = useWallet()
  const [showModal, setShowModal] = useState(false)

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
      <button
        onClick={handleDisconnect}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 rounded-lg transition-colors"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-white text-sm font-medium">
          {formatAddress(publicKey.toBase58())}
        </span>
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={connecting}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 rounded-lg transition-colors disabled:opacity-50"
      >
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="text-white text-sm font-medium">
          {connecting ? 'Connecting...' : 'Select Wallet'}
        </span>
      </button>

      {/* Wallet Selection Modal - Rendered as Portal */}
      {showModal && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[#1a1a2e] border border-purple-500/30 rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto"
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
                  className="w-full flex items-center gap-4 p-4 bg-[#0a0a1f]/50 hover:bg-purple-600/20 border border-purple-500/20 hover:border-purple-500/40 rounded-xl transition-all"
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
                      className="w-full flex items-center gap-4 p-4 bg-[#0a0a1f]/30 hover:bg-purple-600/10 border border-purple-500/10 hover:border-purple-500/20 rounded-xl transition-all"
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
