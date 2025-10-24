/**
 * Utility functions for storing and retrieving wallet address
 */

const WALLET_ADDRESS_KEY = 'wallet_address'

export function setWalletAddress(address: string): void {
  localStorage.setItem(WALLET_ADDRESS_KEY, address)
}

export function getWalletAddress(): string | null {
  return localStorage.getItem(WALLET_ADDRESS_KEY)
}

export function removeWalletAddress(): void {
  localStorage.removeItem(WALLET_ADDRESS_KEY)
}
