import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

interface Message {
  id: string;
  sender_id: string;
  reciever_id: string;
  content: string;
  attachment_url?: string;
  created_at: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);

  const userId = 'your-user-id'; // ⚠️ Replace this later with Supabase auth session

  // Fetch existing messages
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) setMessages(data);
  };

  // Upload attachment
  const uploadAttachment = async (file: File): Promise<string | null> => {
    const filePath = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('message_attachments')
      .upload(filePath, file);
    if (error) return null;

    const { data: urlData } = supabase.storage
      .from('message_attachments')
      .getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  // Send a message
  const sendMessage = async () => {
    let attachmentUrl = null;
    if (attachment) attachmentUrl = await uploadAttachment(attachment);

    await supabase.from('messages').insert([
      {
        sender_id: userId,
        reciever_id: 'target-user-id', // Replace dynamically later
        content: newMessage,
        attachment_url: attachmentUrl,
      },
    ]);

    setNewMessage('');
    setAttachment(null);
  };

  // Realtime subscription
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('realtime-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto border rounded-xl shadow-md bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg ${
              msg.sender_id === userId
                ? 'bg-blue-500 text-white self-end ml-auto max-w-[80%]'
                : 'bg-gray-200 text-black max-w-[80%]'
            }`}
          >
            <p>{msg.content}</p>
            {msg.attachment_url && (
              <a
                href={msg.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline mt-1 block"
              >
                View Attachment
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center border-t p-2 gap-2">
        <label className="cursor-pointer">
          📎
          <input
            type="file"
            onChange={(e) => setAttachment(e.target.files?.[0] || null)}
            className="hidden"
          />
        </label>
        <input
          type="text"
          placeholder="Type your message..."
          className="flex-1 border rounded-lg p-2"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
}
