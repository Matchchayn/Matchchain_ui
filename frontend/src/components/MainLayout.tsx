import { Outlet } from 'react-router-dom'
import Header from '../Home/Header'
import Sidebar from './Sidebar'
import MobileBottomNav from './MobileBottomNav'
import { useEffect } from 'react'
import { prefetchAppData } from '../utils/prefetchService'

interface MainLayoutProps {
    session: any
    isLoading?: boolean
}

export default function MainLayout({ session, isLoading }: MainLayoutProps) {
    const userId = session?.user?.id || session?.user?._id
    const token = session?.token

    useEffect(() => {
        if (userId && token) {
            prefetchAppData(userId, token)
        }
    }, [userId, token])

    return (
        <div className="min-h-screen bg-[#090a1e] flex flex-col">
            <Header userId={userId} isLoading={isLoading} />
            <Sidebar />
            <div className="flex-1 lg:pl-64 flex flex-col">
                <Outlet />
            </div>
            <MobileBottomNav />
        </div>
    )
}
