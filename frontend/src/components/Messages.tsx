import { useState, useEffect } from 'react'
import { supabase } from '../client'
import type { Session } from '@supabase/supabase-js'
import Header from '../Home/Header'
import Sidebar from './Sidebar'
import ChatWindow from './ChatWindow'

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
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
    subscribeToConversations()
  }, [session.user.id])

  async function fetchConversations() {
    try {
      console.log('Fetching matches for Messages page, user:', session.user.id)

      // Get all matches (mutual likes)
      const { data: myLikes, error: myLikesError } = await supabase
        .from('user_likes')
        .select('liked_user_id')
        .eq('user_id', session.user.id)

      if (myLikesError) throw myLikesError

      const { data: theirLikes, error: theirLikesError } = await supabase
        .from('user_likes')
        .select('user_id, created_at')
        .eq('liked_user_id', session.user.id)

      if (theirLikesError) throw theirLikesError

      const myLikedIds = myLikes?.map(like => like.liked_user_id) || []
      const mutualLikes = theirLikes?.filter(like => myLikedIds.includes(like.user_id)) || []

      console.log('Found', mutualLikes.length, 'matches')

      if (mutualLikes.length === 0) {
        setConversations([])
        setLoading(false)
        return
      }

      // For each match, get their details
      const conversationsWithDetails = await Promise.all(
        mutualLikes.map(async (like) => {
          const otherUserId = like.user_id

          // Get other user's profile
          const { data: profile } = await supabase
            .from('Profile')
            .select('first_name, last_name')
            .eq('id', otherUserId)
            .single()

          // Get profile picture from user_media (display_order: 1)
          const { data: profileMedia } = await supabase
            .from('user_media')
            .select('media_url')
            .eq('user_id', otherUserId)
            .eq('display_order', 1)
            .maybeSingle()

          let avatarUrl = null
          if (profileMedia?.media_url) {
            const { data: urlData } = await supabase.storage
              .from('user-videos')
              .createSignedUrl(profileMedia.media_url, 3600)
            avatarUrl = urlData?.signedUrl || null
          }

          // Get online status
          const { data: presence } = await supabase
            .from('user_presence')
            .select('is_online')
            .eq('user_id', otherUserId)
            .maybeSingle()

          // Check if conversation exists (either way around)
          const { data: conversation } = await supabase
            .from('conversations')
            .select('id, updated_at')
            .or(`and(user1_id.eq.${session.user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${session.user.id})`)
            .maybeSingle()

          let lastMessage = null
          let unreadCount = 0
          let conversationId = conversation?.id || null

          // If conversation exists, get messages
          if (conversationId) {
            const { data: msg } = await supabase
              .from('messages')
              .select('content, created_at, is_read, message_type')
              .eq('conversation_id', conversationId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            lastMessage = msg

            // Get unread count
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conversationId)
              .eq('is_read', false)
              .neq('sender_id', session.user.id)

            unreadCount = count || 0
          }

          return {
            id: conversationId || `temp-${otherUserId}`,
            other_user: {
              id: otherUserId,
              first_name: profile?.first_name || 'Unknown',
              last_name: profile?.last_name || '',
              avatar_url: avatarUrl,
              is_online: presence?.is_online || false
            },
            last_message: lastMessage,
            unread_count: unreadCount
          }
        })
      )

      setConversations(conversationsWithDetails)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  function subscribeToConversations() {
    // Subscribe to new messages to update conversation list
    const channel = supabase
      .channel('conversations-updates')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          // Refresh conversations when any message is sent/received
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  async function handleConversationClick(convo: Conversation) {
    console.log('handleConversationClick called with convo:', convo)
    setSelectedUser(convo.other_user)

    // If conversation doesn't exist yet (temp ID), create it
    if (convo.id.startsWith('temp-')) {
      const otherUserId = convo.other_user.id
      console.log('Creating new conversation for user:', otherUserId)

      // Set temp ID first so ChatWindow can render immediately
      setSelectedConversation(convo.id)

      try {
        const { data: newConvo, error } = await supabase
          .from('conversations')
          .insert({
            user1_id: session.user.id,
            user2_id: otherUserId
          })
          .select()
          .single()

        if (error) throw error

        // Update with the real conversation ID
        if (newConvo) {
          console.log('Conversation created successfully:', newConvo.id)
          setSelectedConversation(newConvo.id)
          // Refresh to update the list with real ID
          fetchConversations()
        }
      } catch (error) {
        console.error('Error creating conversation:', error)
      }
    } else {
      console.log('Using existing conversation:', convo.id)
      setSelectedConversation(convo.id)
    }
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

      <div className="min-h-screen bg-[#0a0a1f] pt-16 lg:pt-20 lg:pl-64">
        <div className="flex h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)]">

          {/* Left: Conversations List */}
          <div className={`${selectedConversation ? 'hidden lg:block' : 'block'} w-full border-r border-purple-500/20 bg-[#0a0a1f]`} style={{ width: selectedConversation ? 'auto' : '100%', maxWidth: '400px' }}>
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
                    className={`w-full p-4 flex items-start gap-3 hover:bg-purple-500/5 transition-colors ${
                      selectedConversation === convo.id ? 'bg-purple-500/10' : ''
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
                          {convo.other_user.first_name.charAt(0)}
                        </div>
                      )}
                      {convo.other_user.is_online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a1f]"></div>
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
          <div className={`${selectedConversation ? 'block' : 'hidden lg:block'} flex-1 bg-[#0a0a1f]`}>
            {selectedConversation && selectedUser ? (
              <ChatWindow
                conversationId={selectedConversation}
                currentUserId={session.user.id}
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
    </>
  )
}
