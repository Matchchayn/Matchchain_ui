import { useState, useEffect, useRef } from 'react'
import { supabase } from '../client'

interface Message {
  id: string
  content: string
  sender_id: string
  is_read: boolean
  created_at: string
  message_type?: string
}

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
  otherUser: any
  onBack: () => void
}

export default function ChatWindow({ conversationId, currentUserId, otherUser: initialOtherUser, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [otherUser, setOtherUser] = useState<any>(initialOtherUser)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    console.log('ChatWindow mounted/updated with conversationId:', conversationId, 'otherUser:', initialOtherUser)
    setOtherUser(initialOtherUser)
    if (!conversationId.startsWith('temp-')) {
      console.log('Loading conversation data for real conversation:', conversationId)
      fetchConversationDetails()
      fetchMessages()
      subscribeToMessages()
      markMessagesAsRead()
    } else {
      console.log('Temp conversation, skipping data load')
    }
  }, [conversationId, initialOtherUser])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function fetchConversationDetails() {
    try {
      // Skip if this is a temp conversation ID
      if (conversationId.startsWith('temp-')) {
        console.log('Temp conversation, skipping fetch')
        return
      }

      // Get conversation
      const { data: convo, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (error) throw error

      // Get other user's ID
      const otherUserId = convo.user1_id === currentUserId ? convo.user2_id : convo.user1_id

      // Get other user's profile
      const { data: profile } = await supabase
        .from('Profile')
        .select('first_name, last_name, avatar_url')
        .eq('id', otherUserId)
        .single()

      // Get online status
      const { data: presence } = await supabase
        .from('user_presence')
        .select('is_online')
        .eq('user_id', otherUserId)
        .single()

      setOtherUser({
        id: otherUserId,
        ...profile,
        is_online: presence?.is_online || false
      })
    } catch (error) {
      console.error('Error fetching conversation details:', error)
    }
  }

  async function fetchMessages() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  function subscribeToMessages() {
    // Subscribe to new messages in real-time
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message])

          // Mark as read if message is from other user
          if (payload.new.sender_id !== currentUserId) {
            markMessageAsRead(payload.new.id)
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages(prev => prev.map(msg =>
            msg.id === payload.new.id ? payload.new as Message : msg
          ))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  async function markMessagesAsRead() {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('is_read', false)
        .neq('sender_id', currentUserId)
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  async function markMessageAsRead(messageId: string) {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || uploading) return

    // Don't send if still using temp conversation ID
    if (conversationId.startsWith('temp-')) {
      console.log('Cannot send attachment: conversation still being created')
      return
    }

    try {
      setUploading(true)
      console.log('Uploading file:', file.name)

      // Upload to message_attachments bucket
      const fileExt = file.name.split('.').pop()
      const fileName = `${conversationId}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('message_attachments')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = await supabase.storage
        .from('message_attachments')
        .createSignedUrl(fileName, 3600 * 24 * 7) // 7 days

      if (!urlData?.signedUrl) throw new Error('Failed to get file URL')

      // Send message with attachment URL
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: urlData.signedUrl,
          message_type: 'attachment'
        })

      if (messageError) throw messageError
      console.log('Attachment sent successfully')

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    // Don't send if still using temp conversation ID
    if (conversationId.startsWith('temp-')) {
      console.log('Cannot send message: conversation still being created')
      return
    }

    try {
      setSending(true)
      console.log('Sending message to conversation:', conversationId)
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: newMessage.trim()
        })

      if (error) throw error
      console.log('Message sent successfully')
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function formatTime(timestamp: string) {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  function formatDate(timestamp: string) {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  // Group messages by date
  function groupMessagesByDate() {
    const groups: { [key: string]: Message[] } = {}
    messages.forEach(msg => {
      const date = formatDate(msg.created_at)
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(msg)
    })
    return groups
  }

  const messageGroups = groupMessagesByDate()

  if (!otherUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-purple-500/20 bg-[#0a0a1f]">
        <button
          onClick={onBack}
          className="lg:hidden text-white hover:text-purple-400 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="relative flex-shrink-0">
          {otherUser.avatar_url ? (
            <img
              src={otherUser.avatar_url}
              alt={otherUser.first_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
              {otherUser.first_name?.charAt(0)}
            </div>
          )}
          {otherUser.is_online && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a1f]"></div>
          )}
        </div>

        <div className="flex-1">
          <h2 className="text-white font-semibold flex items-center gap-2">
            {otherUser.first_name} {otherUser.last_name}
            <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
          </h2>
          {otherUser.is_online && (
            <p className="text-xs text-green-400">Online</p>
          )}
        </div>

        <div className="flex gap-2">
          <button className="w-10 h-10 rounded-full bg-purple-500/20 hover:bg-purple-500/30 flex items-center justify-center text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          <button className="w-10 h-10 rounded-full bg-purple-500/20 hover:bg-purple-500/30 flex items-center justify-center text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-[#0a0a1f] to-[#1a1a2e]">
        {Object.entries(messageGroups).map(([date, msgs]) => (
          <div key={date}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <div className="px-4 py-1 bg-white/10 rounded-full text-xs text-gray-400">
                {date}
              </div>
            </div>

            {/* Messages for this date */}
            {msgs.map((msg) => (
              <div
                key={msg.id}
                className={`flex mb-4 ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    msg.sender_id === currentUserId
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  {msg.message_type === 'attachment' ? (
                    <div className="space-y-2">
                      <a
                        href={msg.content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={msg.content}
                          alt="Attachment"
                          className="rounded-lg max-w-full h-auto max-h-64 object-cover"
                          onError={(e) => {
                            // If image fails to load, show as link
                            e.currentTarget.style.display = 'none'
                            const link = e.currentTarget.nextElementSibling as HTMLElement
                            if (link) link.style.display = 'block'
                          }}
                        />
                        <div style={{ display: 'none' }} className="flex items-center gap-2 text-sm">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span>View Attachment</span>
                        </div>
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  )}
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className={`text-xs ${msg.sender_id === currentUserId ? 'text-white/70' : 'text-gray-400'}`}>
                      {formatTime(msg.created_at)}
                    </span>
                    {msg.sender_id === currentUserId && (
                      <svg
                        className={`w-4 h-4 ${msg.is_read ? 'text-blue-400' : 'text-white/50'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-purple-500/20 bg-[#0a0a1f]">
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || conversationId.startsWith('temp-')}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors flex-shrink-0"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            )}
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 px-4 py-3 bg-white/5 border border-purple-500/20 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            disabled={sending}
          />

          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-10 h-10 rounded-full bg-white hover:bg-white/90 disabled:bg-white/50 disabled:cursor-not-allowed flex items-center justify-center text-[#0a0a1f] transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}
