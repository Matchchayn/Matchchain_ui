import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import { socketService } from '../utils/socketService'
import CallScreen from './Call/CallScreen'
import { useAlert } from '../hooks/useAlert'
import { API_BASE_URL } from '../config';

interface Message {
  id: string
  content: string
  sender_id: string
  is_read: boolean
  created_at: string
  message_type?: string
  isUploading?: boolean
}

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
  otherUser: any
  onBack: () => void
}

export default function ChatWindow({ conversationId, currentUserId, otherUser: initialOtherUser, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const cached = localStorage.getItem(`msgs_${conversationId}`)
    return cached ? JSON.parse(cached) : []
  })
  const [newMessage, setNewMessage] = useState('')
  const [otherUser, setOtherUser] = useState<any>(initialOtherUser)
  const [isInitialLoading, setIsInitialLoading] = useState(() => {
    return !localStorage.getItem(`msgs_${conversationId}`)
  })
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false)
  const typingTimeoutRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCalling, setIsCalling] = useState(false)
  const [callType, setCallType] = useState<'phone' | 'video'>('phone')
  const [isCallMenuOpen, setIsCallMenuOpen] = useState(false)
  const callMenuRef = useRef<HTMLDivElement>(null)
  const { showAlert } = useAlert()

  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<any>(null)

  useEffect(() => {
    setOtherUser(initialOtherUser)
    socketService.connect(currentUserId)
    const socket = socketService.getSocket()

    if (socket) {
      socket.on('user_typing', (data: any) => {
        if (data.senderId === initialOtherUser.id) {
          setIsOtherUserTyping(true)
        }
      })

      socket.on('user_stop_typing', (data: any) => {
        if (data.senderId === initialOtherUser.id) {
          setIsOtherUserTyping(false)
        }
      })

      socket.on('status_change', (data: any) => {
        if (data.userId === initialOtherUser.id) {
          setOtherUser((prev: any) => ({ ...prev, is_online: data.isOnline }))
        }
      })
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
      if (callMenuRef.current && !callMenuRef.current.contains(event.target as Node)) {
        setIsCallMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    const hasCache = !!localStorage.getItem(`msgs_${conversationId}`)
    fetchMessages(!hasCache)
    const interval = setInterval(() => fetchMessages(false), 3000)

    return () => {
      clearInterval(interval)
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      document.removeEventListener('mousedown', handleClickOutside)
      if (socket) {
        socket.off('user_typing')
        socket.off('user_stop_typing')
        socket.off('status_change')
      }
    }
  }, [conversationId, initialOtherUser.id, currentUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOtherUserTyping) scrollToBottom()
  }, [isOtherUserTyping])

  async function fetchMessages(isInitial = false) {
    try {
      if (isInitial) setIsInitialLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/messages/${otherUser.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()

      const formattedMessages: Message[] = data.map((msg: any) => ({
        id: msg._id,
        content: msg.content,
        sender_id: msg.sender,
        is_read: msg.isRead,
        created_at: msg.createdAt,
        message_type: msg.messageType,
        isUploading: false
      }))

      setMessages(prev => {
        if (JSON.stringify(prev) === JSON.stringify(formattedMessages)) return prev
        // Save to cache
        localStorage.setItem(`msgs_${conversationId}`, JSON.stringify(formattedMessages))
        return formattedMessages
      })
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      if (isInitial) setIsInitialLoading(false)
    }
  }

  async function sendMessage(e?: React.FormEvent, attachmentUrl?: string, tempIdToReplace?: string, customType?: string) {
    if (e) e.preventDefault()
    if (!newMessage.trim() && !attachmentUrl) return
    if (sending && !tempIdToReplace) return

    const messageContent = attachmentUrl || newMessage.trim()
    const messageType = customType || (attachmentUrl ? 'attachment' : 'text')

    // Only add optimistic message if we aren't replacing one (e.g. from handleImageUpload)
    let tempId = tempIdToReplace
    if (!tempId) {
      tempId = 'temp-' + Date.now()
      const optimisticMsg: Message = {
        id: tempId,
        content: messageContent,
        sender_id: currentUserId,
        is_read: false,
        created_at: new Date().toISOString(),
        message_type: messageType,
        isUploading: false
      }
      setMessages(prev => [...prev, optimisticMsg])
      setNewMessage('')
    }

    try {
      setSending(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: otherUser.id,
          content: messageContent,
          messageType: messageType
        })
      })

      if (!res.ok) throw new Error('Failed to send message')

      const savedMsg = await res.json()

      // Replace optimistic message with saved one
      setMessages(prev => prev.map(m => m.id === tempId ? {
        id: savedMsg._id,
        content: savedMsg.content,
        sender_id: savedMsg.sender,
        is_read: savedMsg.isRead,
        created_at: savedMsg.createdAt,
        message_type: savedMsg.messageType,
        isUploading: false
      } : m))

    } catch (error) {
      console.error('Error sending message:', error)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } finally {
      setSending(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // 1. Create Preview and Add Optimistic Message immediately
    const blobUrl = URL.createObjectURL(file)
    const tempId = 'temp-' + Date.now()

    const optimisticImg: Message = {
      id: tempId,
      content: blobUrl,
      sender_id: currentUserId,
      is_read: false,
      created_at: new Date().toISOString(),
      message_type: 'attachment',
      isUploading: true
    }

    setMessages(prev => [...prev, optimisticImg])

    try {
      setUploading(true)
      const token = localStorage.getItem('token')

      // 2. Get Presigned URL
      const presignedRes = await fetch(`${API_BASE_URL}/api/media/presigned-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type
        })
      })

      if (!presignedRes.ok) throw new Error('Failed to get upload URL')
      const { uploadUrl, publicUrl } = await presignedRes.json()

      // 3. Upload to R2
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })

      if (!uploadRes.ok) throw new Error('Failed to upload image')

      // 4. Send message with final URL and clear loading state
      await sendMessage(undefined, publicUrl, tempId)

    } catch (error) {
      console.error('Error uploading image:', error)
      setMessages(prev => prev.filter(m => m.id !== tempId))
      showAlert('Failed to upload image', 'error')
    } finally {
      setUploading(false)
      URL.revokeObjectURL(blobUrl)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const file = new File([audioBlob], `voicenote-${Date.now()}.webm`, { type: 'audio/webm' })
        await handleAudioUpload(file)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error("Microphone access denied", err)
      showAlert('Microphone access denied', 'error')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      clearInterval(timerIntervalRef.current)
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null; // Prevent upload
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      clearInterval(timerIntervalRef.current)
    }
  }

  async function handleAudioUpload(file: File) {
    const blobUrl = URL.createObjectURL(file)
    const tempId = 'temp-' + Date.now()

    const optimisticAudio: Message = {
      id: tempId,
      content: blobUrl,
      sender_id: currentUserId,
      is_read: false,
      created_at: new Date().toISOString(),
      message_type: 'audio',
      isUploading: true
    }

    setMessages(prev => [...prev, optimisticAudio])

    try {
      setUploading(true)
      const token = localStorage.getItem('token')

      const presignedRes = await fetch(`${API_BASE_URL}/api/media/presigned-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type
        })
      })

      if (!presignedRes.ok) throw new Error('Failed to get upload URL')
      const { uploadUrl, publicUrl } = await presignedRes.json()

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })

      if (!uploadRes.ok) throw new Error('Failed to upload audio')

      await sendMessage(undefined, publicUrl, tempId, 'audio')

    } catch (error) {
      console.error('Error uploading audio:', error)
      setMessages(prev => prev.filter(m => m.id !== tempId))
      showAlert('Failed to upload voice note', 'error')
    } finally {
      setUploading(false)
      URL.revokeObjectURL(blobUrl)
    }
  }

  async function deleteMessage(messageId: string) {
    if (messageId.startsWith('temp-')) return; // Can't delete optimistic messages until saved

    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) throw new Error('Failed to delete message')

      // Remove from state immediately
      setMessages(prev => prev.filter(m => m.id !== messageId))
      // Update cache
      const updatedMessages = messages.filter(m => m.id !== messageId)
      localStorage.setItem(`msgs_${conversationId}`, JSON.stringify(updatedMessages))

    } catch (error) {
      console.error('Error deleting message:', error)
      showAlert('Failed to delete message', 'error')
    }
  }

  async function handleDownload(url: string, fileName: string) {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = fileName || 'downloaded-image.jpg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback: open in new tab
      window.open(url, '_blank')
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const onEmojiClick = (emojiData: any) => {
    setNewMessage(prev => prev + emojiData.emoji);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)

    const socket = socketService.getSocket()
    if (socket) {
      socket.emit('typing', {
        senderId: currentUserId,
        receiverId: otherUser.id,
        senderName: 'Someone' // We could use current user's name if we had it here
      })

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', {
          senderId: currentUserId,
          receiverId: otherUser.id
        })
      }, 2000)
    }
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
      <div className="flex items-center justify-center h-full bg-[#0a0a1f]">
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
          </h2>
          <div className="flex items-center gap-2">
            {otherUser.is_online ? (
              <p className="text-xs text-green-400">Online</p>
            ) : (
              <p className="text-xs text-gray-400">Offline</p>
            )}
            {isOtherUserTyping && (
              <p className="text-xs text-purple-400 animate-pulse font-medium">• {otherUser.first_name} is typing...</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 relative">
          {/* Call Type Dropdown */}
          <div className="relative" ref={callMenuRef}>
            <button
              onClick={() => setIsCallMenuOpen(!isCallMenuOpen)}
              className="w-10 h-10 rounded-full bg-purple-500/20 hover:bg-purple-500/30 flex items-center justify-center text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
            {isCallMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-[#1a1a2e] border border-purple-500/20 rounded-xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => { setCallType('phone'); setIsCalling(true); setIsCallMenuOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-purple-600/20 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Phone Call
                </button>
                <div className="border-t border-purple-500/10" />
                <button
                  onClick={() => { setCallType('video'); setIsCalling(true); setIsCallMenuOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-purple-600/20 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Video Call
                </button>
              </div>
            )}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-10 h-10 rounded-full bg-purple-500/20 hover:bg-purple-500/30 flex items-center justify-center text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a2e] border border-purple-500/20 rounded-xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    navigate(`/profile/${otherUser.id}`)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-purple-600/20 transition-colors text-sm font-medium"
                >
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  View Profile
                </button>
                <div className="border-t border-purple-500/10" />
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Report User
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-[#0a0a1f] to-[#1a1a2e]">
        {isInitialLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, msgs]) => (
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
                  className={`flex mb-4 group/msg ${String(msg.sender_id) === String(currentUserId) ? 'justify-end' : 'justify-start'}`}
                >
                  {String(msg.sender_id) === String(currentUserId) && (
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="opacity-0 group-hover/msg:opacity-100 p-2 text-gray-500 hover:text-red-500 transition-all self-center"
                      title="Delete message"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  <div
                    className={`${msg.message_type === 'attachment' ? '' : 'px-4 py-2 rounded-2xl'} max-w-[70%] relative ${String(msg.sender_id) === String(currentUserId)
                      ? (msg.message_type === 'attachment' ? '' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white')
                      : (msg.message_type === 'attachment' ? '' : 'bg-white/10 text-white')
                      }`}
                  >
                    {msg.message_type === 'attachment' ? (
                      <div className="relative group/img overflow-hidden rounded-xl">
                        <a
                          href={msg.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <img
                            src={msg.content}
                            alt="Attachment"
                            loading="eager"
                            className={`rounded-xl max-w-full h-auto max-h-64 object-cover transition-opacity duration-300 ${msg.isUploading ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'}`}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const link = e.currentTarget.nextElementSibling as HTMLElement
                              if (link) link.style.display = 'block'
                            }}
                          />
                          <div style={{ display: 'none' }} className="flex items-center gap-2 text-sm p-3 bg-white/5 rounded-xl">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span>View Attachment</span>
                          </div>
                        </a>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDownload(msg.content, `image-${msg.id}.jpg`);
                          }}
                          className="absolute top-2 right-2 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white opacity-0 group-hover/img:opacity-100 transition-all z-10"
                          title="Download Image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>

                        {msg.isUploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin shadow-lg"></div>
                          </div>
                        )}

                        <div className={`absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-md bg-black/40 ${msg.isUploading ? 'hidden' : 'flex'}`}>
                          <span className="text-[10px] text-white/90">
                            {formatTime(msg.created_at)}
                          </span>
                          {msg.sender_id === currentUserId && (
                            <svg
                              className={`w-3 h-3 ${msg.is_read ? 'text-blue-400' : 'text-white/70'}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ) : msg.message_type === 'audio' ? (
                      <div className={`relative p-2 rounded-xl flex items-center gap-2 ${msg.isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <audio controls src={msg.content} className="max-w-[180px] sm:max-w-[280px] h-10 outline-none" />
                        {msg.isUploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                            <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                          </div>
                        )}
                        <div className="flex flex-col items-end justify-center ml-1">
                          <span className={`text-[10px] ${msg.sender_id === currentUserId ? 'text-white/70' : 'text-gray-400'}`}>
                            {formatTime(msg.created_at)}
                          </span>
                          {msg.sender_id === currentUserId && (
                            <svg className={`w-3 h-3 ${msg.is_read ? 'text-blue-400' : 'text-white/50'} mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
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
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        {/* Typing Indicator - three animated dots */}
        {isOtherUserTyping && (
          <div className="flex items-end gap-2 px-4 pb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {otherUser.avatar_url ? (
              <img src={otherUser.avatar_url} className="w-6 h-6 rounded-full object-cover flex-shrink-0 opacity-70" alt="" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-purple-600/50 flex-shrink-0 flex items-center justify-center text-white text-[8px] font-bold">
                {otherUser.first_name?.charAt(0)}
              </div>
            )}
            <div className="flex items-center gap-1.5 px-4 py-3 bg-white/10 rounded-2xl rounded-bl-sm">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.9s' }} />
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.9s' }} />
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.9s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 right-4 z-50">
          <EmojiPicker
            theme={Theme.DARK}
            onEmojiClick={onEmojiClick}
            lazyLoadEmojis={true}
          />
        </div>
      )}

      {/* Input */}
      <form onSubmit={(e) => sendMessage(e)} className="p-4 border-t border-purple-500/20 bg-[#0a0a1f]">
        <div className="flex items-center gap-2 sm:gap-3">
          {isRecording ? (
            <div className="flex-1 flex items-center justify-between px-4 py-2 sm:py-3 bg-red-500/10 border border-red-500/30 rounded-full animate-in fade-in zoom-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                <span className="text-red-400 font-mono text-sm font-bold">
                  {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <button type="button" onClick={cancelRecording} className="text-gray-400 hover:text-red-400 text-sm font-semibold transition-colors">Cancel</button>
                <button type="button" onClick={stopRecording} className="text-white hover:text-green-400 text-sm font-bold bg-green-500/20 hover:bg-green-500/30 px-3 sm:px-4 py-1.5 rounded-full transition-colors flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Send
                </button>
              </div>
            </div>
          ) : (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || sending}
                className="w-10 h-10 rounded-full bg-white/5 border border-purple-500/20 flex items-center justify-center text-gray-400 hover:text-white hover:border-purple-500 transition-all flex-shrink-0"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${showEmojiPicker ? 'text-purple-500 bg-purple-500/20' : 'text-gray-400 hover:text-white bg-white/5 border border-purple-500/20 hover:border-purple-500'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                placeholder="Type your message here..."
                className="flex-1 px-4 py-3 bg-white/5 border border-purple-500/20 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors min-w-0"
                disabled={sending || uploading}
              />

              {!newMessage.trim() && !uploading && !sending ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600 text-purple-400 hover:text-white flex items-center justify-center transition-all flex-shrink-0 hover:shadow-[0_0_15px_rgba(147,51,234,0.5)]"
                  title="Record Voice Note"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !uploading) || sending || uploading}
                  className="w-10 h-10 rounded-full bg-white hover:bg-white/90 disabled:bg-white/50 disabled:cursor-not-allowed flex items-center justify-center text-[#0a0a1f] transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </form>

      {/* Full-Screen Call Screen */}
      {isCalling && (
        <CallScreen
          callType={callType}
          currentUserId={currentUserId}
          otherUser={{
            id: otherUser.id,
            first_name: otherUser.first_name,
            last_name: otherUser.last_name,
            avatar_url: otherUser.avatar_url
          }}
          onClose={() => setIsCalling(false)}
        />
      )}
    </div>
  )
}
