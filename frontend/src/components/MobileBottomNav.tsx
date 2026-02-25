import { useNavigate, useLocation } from 'react-router-dom'

export default function MobileBottomNav() {
    const navigate = useNavigate()
    const location = useLocation()

    const isActive = (path: string) => location.pathname === path

    const navItems = [
        { path: '/', label: 'Match', icon: <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /> },
        { path: '/likes', label: 'Likes', icon: <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /> },
        { path: '/events', label: 'Events', icon: <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" /> },
        { path: '/messages', label: 'Messages', icon: <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /> },
        { path: '/profile', label: 'Profile', icon: <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /> },
    ]

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a1f]/95 backdrop-blur-md border-t border-purple-500/20 z-50">
            <div className="flex items-center justify-around px-2 py-2">
                {navItems.map(item => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`flex flex-col items-center gap-1 p-2 ${isActive(item.path) ? 'text-purple-400' : 'text-white/60'}`}
                    >
                        {item.label === 'Match' ? (
                            <img src="/matchlogo.png" alt="Match" className="w-8 h-8 object-contain" />
                        ) : (
                            <>
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    {item.icon}
                                </svg>
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </>
                        )}
                    </button>
                ))}
            </div>
        </nav>
    )
}
