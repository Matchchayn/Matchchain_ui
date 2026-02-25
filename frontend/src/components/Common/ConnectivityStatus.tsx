import { useState, useEffect } from 'react'

export default function ConnectivityStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [shouldShow, setShouldShow] = useState(false)

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true)
            // Keep showing for a moment to say "Back online" then hide
            setTimeout(() => setShouldShow(false), 3000)
        }
        const handleOffline = () => {
            setIsOnline(false)
            setShouldShow(true)
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        // Initial check
        if (!navigator.onLine) {
            setShouldShow(true)
        }

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    useEffect(() => {
        if (shouldShow) {
            document.documentElement.style.setProperty('--connectivity-height', '36px')
        } else {
            document.documentElement.style.setProperty('--connectivity-height', '0px')
        }
    }, [shouldShow])

    if (!shouldShow) return null

    return (
        <div className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-500 transform ${shouldShow ? 'translate-y-0' : '-translate-y-full'}`}>
            <div className={`w-full py-1.5 px-4 flex items-center justify-center gap-2 backdrop-blur-md border-b text-[11px] font-bold shadow-lg ${isOnline
                ? 'bg-green-500/20 border-green-500/30 text-green-400'
                : 'bg-red-500/20 border-red-500/30 text-red-400'
                }`}>
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>
                    {isOnline ? 'Internet connection restored' : 'No internet connection. Please check your network.'}
                </span>
            </div>
        </div>
    )
}
