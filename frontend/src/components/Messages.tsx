import { useState, useEffect } from 'react'
import Header from '../Home/Header'
import Sidebar from './Sidebar'
import ChatWindow from './ChatWindow'
import MobileBottomNav from './MobileBottomNav'
import { socketService } from '../utils/socketService'
import { API_BASE_URL } from '../config';

interface Session {
  user: {
    id: string;
    [key: string]: any;
  };
  token: string;
}


interface Conversation {
  id: string
  other_user: {
    id: string
    first_name: string
    last_name: string
    avatar_url: string | null
    is_online: boolean
  }
  last_message: {
    content: string
    created_at: string
    is_read: boolean
    message_type?: string
  } | null
  unread_count: number
}

interface MessagesProps {
  session: Session
}

export default function Messages({ session }: MessagesProps) {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const cached = localStorage.getItem(`convos_${session.user.id}`)
    return cached ? JSON.parse(cached) : []
  })
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [loading, setLoading] = useState(() => {
    const cached = localStorage.getItem(`convos_${session.user.id}`)
    return !cached // Only loading if no cache
  })

  useEffect(() => {
    const hasCache = !!localStorage.getItem(`convos_${session.user.id}`)
    fetchConversations(!hasCache)

    // Socket status listeners
    socketService.connect(session.user.id || session.user._id)
    const socket = socketService.getSocket()
    if (socket) {
      socket.on('status_change', (data: any) => {
        setConversations(prev => prev.map(convo =>
          convo.other_user.id === data.userId
            ? { ...convo, other_user: { ...convo.other_user, is_online: data.isOnline } }
            : convo
        ))
      })
    }

    const interval = setInterval(() => fetchConversations(false), 10000)
    return () => {
      clearInterval(interval)
      if (socket) socket.off('status_change')
    }
  }, [session.user.id])

  async function fetchConversations(isInitial = false) {
    try {
      if (isInitial) setLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()

      const formattedConversations: Conversation[] = data.map((item: any) => ({
        id: item.otherUser._id,
        other_user: {
          id: item.otherUser._id,
          first_name: item.otherUser.firstName,
          last_name: item.otherUser.lastName,
          avatar_url: item.otherUser.avatarUrl,
          is_online: item.otherUser.isOnline
        },
        last_message: item.lastMessage ? {
          content: item.lastMessage.content,
          created_at: item.lastMessage.createdAt,
          is_read: item.lastMessage.isRead,
          message_type: item.lastMessage.messageType
        } : null,
        unread_count: 0
      }))

      setConversations(formattedConversations)
      // Save to cache for next time
      localStorage.setItem(`convos_${session.user.id}`, JSON.stringify(formattedConversations))
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  async function handleConversationClick(convo: Conversation) {
    setSelectedUser(convo.other_user)
    setSelectedConversation(convo.id)
  }

  function formatTime(timestamp: string) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <>
      <Sidebar />
      <Header userId={session.user.id} />

      <div className="min-h-screen bg-[#090a1e] pt-16 lg:pt-20 lg:pl-64">
        <div className="flex h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)]">

          {/* Left: Conversations List */}
          <div className={`${selectedConversation ? 'hidden lg:block' : 'block'} w-full border-r border-purple-500/20 bg-[#090a1e]`} style={{ width: selectedConversation ? '360px' : '100%', maxWidth: '400px' }}>
            <div className="p-3 border-b border-purple-500/20">
              <h1 className="text-xl font-bold text-white">Messages</h1>
            </div>

            <div className="overflow-y-auto" style={{ height: 'calc(100vh - 8rem)' }}>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm">No conversations yet</p>
                  <p className="text-gray-500 text-xs mt-2">Start matching to chat with people!</p>
                </div>
              ) : (
                conversations.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => handleConversationClick(convo)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-purple-500/5 transition-colors ${selectedConversation === convo.id ? 'bg-purple-500/10' : ''
                      }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {convo.other_user.avatar_url ? (
                        <img
                          src={convo.other_user.avatar_url}
                          alt={convo.other_user.first_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                          {convo.other_user?.first_name?.charAt(0) || '?'}
                        </div>
                      )}
                      {convo.other_user.is_online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#090a1e]"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-white font-semibold truncate">
                          {convo.other_user.first_name} {convo.other_user.last_name}
                        </h3>
                        {convo.last_message && (
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {formatTime(convo.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-400 truncate">
                          {convo.last_message
                            ? (convo.last_message.message_type === 'attachment' ? '📷 Sent image' : convo.last_message.content)
                            : 'No messages yet'}
                        </p>
                        {convo.unread_count > 0 && (
                          <span className="ml-2 flex-shrink-0 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-xs text-white">
                            {convo.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: Chat Window */}
          <div className={`${selectedConversation ? 'block' : 'hidden lg:block'} flex-1 bg-[#090a1e]`}>
            {selectedConversation && selectedUser ? (
              <ChatWindow
                conversationId={selectedConversation}
                currentUserId={session.user._id || session.user.id}
                otherUser={selectedUser}
                onBack={() => {
                  setSelectedConversation(null)
                  setSelectedUser(null)
                }}
              />
            ) : (
              <div className="hidden lg:flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-400">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Bottom Nav — only visible when conversation list is showing */}
      {!selectedConversation && <MobileBottomNav />}
    </>
  )
}
