interface TopLoaderProps {
    message?: string
}

export default function TopLoader({ message }: TopLoaderProps) {
    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-[#090a1e]/90 backdrop-blur-md border border-purple-500/30 rounded-full px-5 py-2.5 shadow-lg">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            {message && (
                <span className="text-white text-sm font-medium whitespace-nowrap">{message}</span>
            )}
        </div>
    )
}
