import { useMemo } from 'react'
import type { FC, ReactNode } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { clusterApiUrl } from '@solana/web3.js'

interface WalletContextProviderProps {
  children: ReactNode
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
  // Using mainnet-beta for production
  const network = WalletAdapterNetwork.Mainnet

  // Use custom RPC endpoint or fallback to public mainnet
  // Get a free RPC from: https://www.helius.dev/ or https://www.quicknode.com/
  const endpoint = useMemo(() => {
    // Use environment variable for custom RPC if provided
    if (import.meta.env.VITE_SOLANA_RPC_URL) {
      return import.meta.env.VITE_SOLANA_RPC_URL
    }

    // Default to mainnet (may have rate limits)
    return clusterApiUrl(network)
  }, [network])

  // Wallets will be auto-detected by the adapter
  const wallets = useMemo(
    () => [],
    []
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  )
}
